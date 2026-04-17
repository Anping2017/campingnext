import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { inferTags, inferFacilities, convertLegacyTags, convertLegacyFacilities } from '@/lib/camp-metadata';

// 获取 OpenAI 客户端
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new OpenAI({ apiKey });
}

// 从 Google Maps 链接中提取 Place ID
function extractPlaceIdFromUrl(url: string): string | null {
  // 匹配 https://www.google.com/maps/place/.../@lat,lng,zoom/data=...
  const placeIdMatch = url.match(/\/place\/([^/]+)/);
  if (placeIdMatch) {
    return placeIdMatch[1];
  }

  // 匹配 https://maps.google.com/?cid=...
  const cidMatch = url.match(/[?&]cid=([^&]+)/);
  if (cidMatch) {
    return cidMatch[1];
  }

  // 匹配 data=!4m...!3m...!1s... 格式
  const dataMatch = url.match(/!1s([^!]+)/);
  if (dataMatch) {
    return decodeURIComponent(dataMatch[1]);
  }

  return null;
}

// 使用 Google Places API 获取地点信息
async function fetchPlaceDetails(placeIdOrName: string, isPlaceId: boolean) {
  // 使用服务器端环境变量（不需要 NEXT_PUBLIC_ 前缀）
  const googleApiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!googleApiKey) {
    throw new Error('GOOGLE_MAPS_API_KEY 环境变量未设置。请在 .env.local 中添加 GOOGLE_MAPS_API_KEY');
  }

  let placeId = placeIdOrName;
  
  // 如果不是 Place ID，先搜索地点
  if (!isPlaceId) {
    const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(placeIdOrName)}&inputtype=textquery&fields=place_id&key=${googleApiKey}`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    
    if (searchData.candidates && searchData.candidates.length > 0) {
      placeId = searchData.candidates[0].place_id;
    } else {
      throw new Error('未找到该地点');
    }
  }

  // 获取地点详情
  const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,geometry,rating,user_ratings_total,types,photos,reviews,opening_hours,price_level,website,formatted_phone_number&key=${googleApiKey}&language=zh-CN`;
  const detailsResponse = await fetch(detailsUrl);
  const detailsData = await detailsResponse.json();

  if (detailsData.status !== 'OK') {
    throw new Error(`Google Places API 错误: ${detailsData.status}`);
  }

  return detailsData.result;
}

// 使用 OpenAI 总结评价
async function summarizeReviews(reviews: any[]): Promise<string> {
  const openai = getOpenAIClient();
  if (!openai || !reviews || reviews.length === 0) {
    return '';
  }

  try {
    // 提取评价文本（最多 20 条）
    const reviewTexts = reviews
      .slice(0, 20)
      .map((r: any) => `评分: ${r.rating}/5\n${r.text}`)
      .join('\n\n---\n\n');

    const prompt = `请总结以下 Google Maps 上关于这个露营地的评价，生成一段简洁的中文描述（100-150字）。重点关注：
1. 整体评价和评分趋势
2. 主要优点（设施、环境、服务等）
3. 主要缺点或需要注意的问题
4. 适合的人群或场景

评价内容：
${reviewTexts}

请直接返回总结文本，不要包含"总结"、"评价"等标题。`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '你是一个专业的旅游和露营评价分析专家，擅长从用户评价中提取关键信息并生成简洁的总结。',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    return response.choices[0].message.content?.trim() || '';
  } catch (error) {
    console.error('AI 总结评价失败:', error);
    return '';
  }
}

// 将 Google Places 类型映射到营地类型
function mapPlaceTypeToCampType(types: string[]): 'DOC' | 'Holiday Park' | 'Freedom Camping' | 'Local Camp' | 'Private Campground' | undefined {
  if (types.some(t => t.includes('campground') || t.includes('camping'))) {
    if (types.some(t => t.includes('holiday') || t.includes('park'))) {
      return 'Holiday Park';
    }
    if (types.some(t => t.includes('national_park') || t.includes('park') || t.includes('conservation'))) {
      return 'DOC';
    }
    if (types.some(t => t.includes('local') || t.includes('municipal') || t.includes('council'))) {
      return 'Local Camp';
    }
    if (types.some(t => t.includes('private') || t.includes('commercial'))) {
      return 'Private Campground';
    }
    return 'Freedom Camping';
  }
  return undefined;
}

// 从地址中提取地区（新西兰）
function extractRegion(address: string): string {
  const nzRegions = [
    'Auckland', 'Wellington', 'Christchurch', 'Hamilton', 'Tauranga',
    'Napier', 'Palmerston North', 'Dunedin', 'Rotorua', 'New Plymouth',
    'Whangarei', 'Invercargill', 'Nelson', 'Hastings', 'Gisborne',
    'Coromandel', 'Bay of Plenty', 'Waikato', 'Canterbury', 'Otago',
    'Southland', 'West Coast', 'Marlborough', 'Tasman', 'Fiordland',
    'Central North Island', 'Northland', 'Manawatu', 'Wairarapa'
  ];

  for (const region of nzRegions) {
    if (address.includes(region)) {
      return region;
    }
  }

  // 如果找不到，尝试从地址中提取第一个主要地名
  const parts = address.split(',');
  if (parts.length > 1) {
    return parts[parts.length - 2].trim();
  }

  return 'Unknown';
}

// 旧的推断函数已移除，现在使用 @/lib/camp-metadata 中的智能推断系统

// 根据评分推断难度
function inferDifficulty(rating: number, reviews: any[]): 'easy' | 'medium' | 'hard' {
  const reviewText = reviews.map((r: any) => r.text?.toLowerCase() || '').join(' ').toLowerCase();
  
  if (reviewText.includes('challenging') || reviewText.includes('difficult') || reviewText.includes('hard') || reviewText.includes('困难') || reviewText.includes('挑战')) {
    return 'hard';
  }
  if (reviewText.includes('moderate') || reviewText.includes('medium') || reviewText.includes('中等')) {
    return 'medium';
  }
  if (rating >= 4.0 || reviewText.includes('easy') || reviewText.includes('simple') || reviewText.includes('简单') || reviewText.includes('容易')) {
    return 'easy';
  }
  
  return 'medium';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, placeName } = body;

    if (!url && !placeName) {
      return NextResponse.json(
        { error: '请提供 Google Maps 链接或地点名称' },
        { status: 400 }
      );
    }

    // 确定是 Place ID 还是地点名称
    let placeIdOrName: string;
    let isPlaceId = false;

    if (url) {
      // 尝试从 URL 中提取 Place ID
      const extractedId = extractPlaceIdFromUrl(url);
      if (extractedId) {
        placeIdOrName = extractedId;
        isPlaceId = true;
      } else {
        return NextResponse.json(
          { error: '无法从链接中提取地点信息，请提供完整的 Google Maps 链接' },
          { status: 400 }
        );
      }
    } else {
      placeIdOrName = placeName;
      isPlaceId = false;
    }

    // 获取地点详情
    const placeDetails = await fetchPlaceDetails(placeIdOrName, isPlaceId);

    // 提取基本信息
    const name = placeDetails.name || '';
    const address = placeDetails.formatted_address || '';
    const region = extractRegion(address);
    const lat = placeDetails.geometry?.location?.lat || 0;
    const lng = placeDetails.geometry?.location?.lng || 0;
    const rating = placeDetails.rating || 0;
    const userRatingsTotal = placeDetails.user_ratings_total || 0;
    const types = placeDetails.types || [];
    const reviews = placeDetails.reviews || [];

    // 推断营地类型
    const campType = mapPlaceTypeToCampType(types);

    // 使用 AI 总结评价
    const reviewSummary = await summarizeReviews(reviews);

    // 生成描述（结合 AI 总结和基本信息）
    let description = reviewSummary || '';
    if (!description && placeDetails.formatted_address) {
      description = `位于 ${address} 的露营地`;
    }

    // 推断设施和标签（使用新的智能推断系统）
    let facilities = inferFacilities(description || '', campType, []);
    let tags = inferTags(name, description || '', address, facilities, campType);
    
    // 如果 Google Maps 提供了评价，也用于推断
    if (reviews && reviews.length > 0) {
      const reviewText = reviews.map((r: any) => r.text?.toLowerCase() || '').join(' ');
      const additionalTags = inferTags(name, reviewText, address, facilities, campType);
      const additionalFacilities = inferFacilities(reviewText, campType, tags);
      tags = [...new Set([...tags, ...additionalTags])];
      facilities = [...new Set([...facilities, ...additionalFacilities])];
    }
    
    // 转换旧格式（如果有）
    facilities = convertLegacyFacilities(facilities);
    tags = convertLegacyTags(tags);

    // 推断难度
    const difficulty = inferDifficulty(rating, reviews);

    // 估算价格分类（根据 price_level 和 campType）
    let price: 'free' | 'cheap' | 'medium' | 'expensive' = 'medium';
    if (campType === 'DOC') {
      price = 'free'; // DOC 营地通常免费
    } else if (campType === 'Freedom Camping') {
      price = 'free'; // Freedom Camping 通常免费
    } else if (placeDetails.price_level) {
      // 根据 Google Maps price_level 映射：1=$ (便宜), 2=$$ (中等), 3=$$$ (较贵), 4=$$$$ (较贵)
      if (placeDetails.price_level === 1) {
        price = 'cheap';
      } else if (placeDetails.price_level === 2) {
        price = 'medium';
      } else {
        price = 'expensive';
      }
    } else if (campType === 'Holiday Park') {
      price = 'medium'; // Holiday Park 通常中等价格
    } else {
      price = 'cheap'; // 其他类型通常便宜
    }

    // 生成营地 ID（从名称生成）
    const campId = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    return NextResponse.json({
      success: true,
      camp: {
        id: campId,
        name,
        region,
        price,
        tags,
        lat,
        lng,
        description,
        facilities,
        difficulty,
        rating,
        campType,
        // 联系方式
        address: address || undefined,
        phone: placeDetails.formatted_phone_number || undefined,
        email: undefined, // Google Places API 不提供邮箱
        website: placeDetails.website || undefined,
        // 额外信息
        userRatingsTotal,
        openingHours: placeDetails.opening_hours?.weekday_text,
        reviewSummary,
      },
    });
  } catch (error: any) {
    console.error('获取 Google Maps 信息失败:', error);
    return NextResponse.json(
      { error: error.message || '获取地点信息失败，请检查链接或地点名称是否正确' },
      { status: 500 }
    );
  }
}









