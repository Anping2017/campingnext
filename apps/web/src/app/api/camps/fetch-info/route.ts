import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { inferFacilities, convertLegacyTags, convertLegacyFacilities } from '@/lib/camp-metadata';
import { selectTagsIntelligently } from '@/lib/tag-engine';

// 获取 OpenAI 客户端
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new OpenAI({ apiKey });
}

// 从 Google Maps 获取完整地点信息（如果配置了 API Key）
async function getGoogleMapsInfo(name: string): Promise<{
  rating: number | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  lat: number | null;
  lng: number | null;
  region: string | null;
  reviews: any[] | null; // Google Maps 评价
} | null> {
  const googleApiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!googleApiKey) {
    return null; // 如果没有配置 Google Maps API Key，返回 null
  }

  try {
    // 先搜索地点
    const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(name)}&inputtype=textquery&fields=place_id&key=${googleApiKey}`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    
    if (!searchData.candidates || searchData.candidates.length === 0) {
      return null;
    }

    const placeId = searchData.candidates[0].place_id;

    // 获取地点详情（获取所有需要的信息，包括评价用于提取设施信息）
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,geometry,rating,user_ratings_total,formatted_phone_number,website,address_components,reviews,types&key=${googleApiKey}&language=zh-CN`;
    const detailsResponse = await fetch(detailsUrl);
    const detailsData = await detailsResponse.json();

    if (detailsData.status !== 'OK' || !detailsData.result) {
      return null;
    }

    const result = detailsData.result;
    
    // 从地址组件中提取地区信息
    let region: string | null = null;
    if (result.address_components) {
      // 优先查找 administrative_area_level_1（省/州）或 locality（城市）
      const adminArea = result.address_components.find((comp: any) => 
        comp.types.includes('administrative_area_level_1')
      );
      const locality = result.address_components.find((comp: any) => 
        comp.types.includes('locality')
      );
      region = adminArea?.long_name || locality?.long_name || null;
    }

    return {
      rating: result.rating || null,
      address: result.formatted_address || null,
      phone: result.formatted_phone_number || null,
      website: result.website || null,
      lat: result.geometry?.location?.lat || null,
      lng: result.geometry?.location?.lng || null,
      region: region,
      reviews: result.reviews || null, // 评价（用于 AI 分析设施）
      types: result.types || null, // 地点类型
    };
  } catch (error) {
    console.error('从 Google Maps 获取信息失败:', error);
    return null;
  }
}

// 使用 AI 总结评价为优点和缺点
async function summarizeReviews(reviews: any[]): Promise<{
  pros: string[]; // 优点
  cons: string[]; // 缺点
} | null> {
  const openai = getOpenAIClient();
  if (!openai || !reviews || reviews.length === 0) {
    return null;
  }

  try {
    // 分离好评（4-5星）和差评（1-2星）
    const positiveReviews = reviews.filter((r: any) => r.rating >= 4).slice(0, 10);
    const negativeReviews = reviews.filter((r: any) => r.rating <= 2).slice(0, 10);

    if (positiveReviews.length === 0 && negativeReviews.length === 0) {
      return null;
    }

    const positiveTexts = positiveReviews.map((r: any) => `评分: ${r.rating}/5\n${r.text || ''}`).join('\n\n---\n\n');
    const negativeTexts = negativeReviews.map((r: any) => `评分: ${r.rating}/5\n${r.text || ''}`).join('\n\n---\n\n');

    const prompt = `你是新西兰露营专家。请根据以下 Google Maps 评价，总结这个营地的优点和缺点。

${positiveTexts ? `好评（4-5星）：\n${positiveTexts}\n\n` : ''}
${negativeTexts ? `差评（1-2星）：\n${negativeTexts}\n\n` : ''}

请用 JSON 格式返回，包含以下字段：
{
  "pros": ["优点1", "优点2", ...], // 从好评中提取的3-5个主要优点，每个优点10-20字
  "cons": ["缺点1", "缺点2", ...] // 从差评中提取的2-4个主要缺点，每个缺点10-20字
}

要求：
1. 优点和缺点要具体、实用，不要泛泛而谈
2. 重点关注设施、环境、服务、位置等方面
3. 如果某个方面在好评和差评中都提到，优先放在优点中（说明是亮点）
4. 如果只有好评或只有差评，只返回对应的部分
5. 每个优点/缺点应该是独立的、具体的描述

请直接返回 JSON，不要包含其他文字。`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '你是一个专业的新西兰露营专家，擅长从用户评价中提取关键信息。请用 JSON 格式返回结果。',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content?.trim() || '{}';
    const result = JSON.parse(content);

    return {
      pros: result.pros || [],
      cons: result.cons || [],
    };
  } catch (error) {
    console.error('AI 总结评价失败:', error);
    return null;
  }
}

// 使用 AI 生成完整的营地信息（包括地理位置和联系方式）
async function generateCampInfoWithAI(
  name: string,
  userDescription?: string,
  reviewsText?: string,
  placeTypes?: string[] | null
): Promise<{
  description: string;
  facilities: string[];
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  campType?: 'DOC' | 'Holiday Park' | 'Freedom Camping' | 'Local Camp' | 'Private Campground';
  price: 'free' | 'cheap' | 'medium' | 'expensive';
  rating: number;
  region: string;
  lat: number;
  lng: number;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}> {
  const openai = getOpenAIClient();
  
  if (!openai) {
    throw new Error('OpenAI API Key 未配置，无法生成营地信息');
  }

  try {
    // 构建提示词，包含评价信息（如果有）
    let additionalInfo = '';
    if (reviewsText) {
      additionalInfo = `\n\nGoogle Maps 用户评价（用于推断设施）：\n${reviewsText}\n\n请仔细分析评价中提到的设施，如：厕所、淋浴、厨房、电源、WiFi、商店、洗衣房、烧烤架、篝火区、游乐场等。`;
    }
    if (placeTypes && placeTypes.length > 0) {
      additionalInfo += `\n\n地点类型：${placeTypes.join(', ')}`;
    }

    const prompt = `你是新西兰露营专家。根据营地名称${reviewsText ? '和 Google Maps 用户评价' : ''}，生成一个完整的营地信息。请用 JSON 格式返回，包含以下字段：

{
  "description": "一段 100-150 字的中文描述，介绍这个营地的特色、环境、适合的人群等",
  "facilities": ["toilet", "water", "parking", ...], // 使用英文 ID：
  // 基础设施：toilet(厕所), water(饮用水), parking(停车场), trash(垃圾处理), reception(接待处), shower(淋浴), kitchen(厨房), power(电源)
  // 舒适设施：wifi(WiFi), shop(商店), laundry(洗衣房), hot-spring(温泉), spa(桑拿), cafe(咖啡厅), pizza-oven(披萨炉), bbq(烧烤架), fire-pit(篝火区)
  // 娱乐设施：playground(游乐场), pool(泳池), trampoline(蹦床), media-room(影音室), game-room(游戏室), tennis-court(网球场), basketball-court(篮球场), table-tennis(乒乓球台), volleyball-court(排球场)
  "tags": ["beach", "mountain", "hiking", ...], // 使用英文 ID，必须基于实际信息选择，不要猜测。可选标签：
  // 地理位置：beach(海边), mountain(山区), lake(湖边), forest(森林), river(河边)
  // 活动类型：hiking(适合徒步), fishing(适合钓鱼), kayaking(适合皮划艇), stargazing(适合观星), photography(适合摄影)
  // 适合人群：beginner(适合新手), family(适合家庭), solo(适合独行), group(适合团体)
  // 特色：scenic(景色好), quiet(安静), challenging(挑战), heritage(历史遗迹), sunny(阳光充足), shady(有树荫), windy(多风), sheltered(有遮挡)
  // 重要：只选择有明确证据支持的标签，不要过度推断。优先选择地理位置和活动类型标签。
  "difficulty": "easy|medium|hard", // 根据地点类型和名称推断难度
  "campType": "DOC|Holiday Park|Freedom Camping|Local Camp|Private Campground|null", // 根据名称和类型推断，如果不确定返回 null
  "price": "free|cheap|medium|expensive", // 价格分类：free(免费，通常 0 NZD), cheap(便宜，通常 1-15 NZD), medium(中等，通常 16-30 NZD), expensive(较贵，通常 31+ NZD)。DOC 通常 free 或 cheap，Holiday Park 通常 medium 或 expensive，Freedom Camping 通常 free 或 cheap，Local Camp 通常 cheap 或 medium，Private Campground 通常 medium 或 expensive
  "email": "邮箱地址，例如：info@campsite.co.nz" // 根据营地名称查找真实邮箱，如果无法确定返回 null
}

注意：
- 评分（rating）、地址（address）、电话（phone）、网址（website）、地理位置（lat, lng）、地区（region）将从 Google Maps 获取，不需要在此处生成
- 只需要生成描述、设施、标签、难度、营地类型、价格和邮箱
- **设施信息必须基于用户评价中实际提到的内容，不要猜测**

营地名称：${name}
${userDescription ? `用户提供的描述：${userDescription}` : ''}${additionalInfo}

重要提示：
1. 设施信息必须基于用户评价中实际提到的内容，仔细分析评价文本
2. 如果评价中没有提到某个设施，不要添加
3. 所有信息必须基于真实查找，优先使用 DOC、Holiday Park 或 Freedom Camping 官方网站上的信息
4. 如果无法确定真实信息，请返回 null，不要猜测

请直接返回 JSON，不要包含其他文字。`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '你是一个专业的新西兰露营专家，擅长根据地点信息推断营地特征。请用 JSON 格式返回结果。',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content?.trim() || '{}';
    const result = JSON.parse(content);

    // 转换 AI 返回的设施和标签（可能是中文或英文 ID）
    let facilities = result.facilities || [];
    let tags = result.tags || [];

    // 如果 AI 返回的是中文，转换为 ID
    facilities = convertLegacyFacilities(facilities);
    tags = convertLegacyTags(tags);

    // 使用高级标签引擎进行智能标签选择
    const tagContext = {
      name: name.trim(),
      description: result.description || userDescription || '',
      address: result.address || '',
      region: result.region,
      campType: result.campType,
      facilities,
      difficulty: result.difficulty,
      reviews: reviewsText ? reviewsText.split('\n').filter(Boolean) : undefined,
      placeTypes: placeTypes || undefined,
    };
    tags = selectTagsIntelligently(tags, tagContext);

    const inferredFacilities = inferFacilities(
      result.description || userDescription || '',
      result.campType,
      tags
    );
    facilities = [...new Set([...facilities, ...inferredFacilities])];

    return {
      description: result.description || userDescription || `位于 ${result.region || '新西兰'} 的露营地`,
      facilities,
      tags,
      difficulty: result.difficulty || 'medium',
      campType: result.campType || undefined,
      price: (result.price && ['free', 'cheap', 'medium', 'expensive'].includes(result.price)) 
        ? (result.price as 'free' | 'cheap' | 'medium' | 'expensive')
        : 'medium', // 默认中等
      rating: 4.0, // 默认评分，实际评分将从 Google Maps 获取
      // 地理位置、地址、电话、网址将从 Google Maps 获取
      region: 'Unknown', // 将从 Google Maps 获取
      lat: -40.0, // 将从 Google Maps 获取
      lng: 174.0, // 将从 Google Maps 获取
      address: undefined, // 将从 Google Maps 获取
      phone: undefined, // 将从 Google Maps 获取
      website: undefined, // 将从 Google Maps 获取
      // 邮箱由 AI 生成（Google Maps 不提供邮箱）
      email: result.email || undefined,
    };
  } catch (error) {
    console.error('AI 生成信息失败:', error);
    throw error; // 重新抛出错误，让调用者处理
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: '请输入营地名称' },
        { status: 400 }
      );
    }

    // 检查 OpenAI API Key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API Key 未配置，无法生成营地信息' },
        { status: 500 }
      );
    }

    // 优先从 Google Maps 获取地址、电话、网址、地理位置和评分
    const googleMapsInfo = await getGoogleMapsInfo(name.trim());
    console.log('Google Maps 信息:', googleMapsInfo);

    // 使用 AI 总结评价为优点和缺点（如果有评价）
    let reviewSummary: { pros: string[]; cons: string[] } | null = null;
    if (googleMapsInfo?.reviews && googleMapsInfo.reviews.length > 0) {
      reviewSummary = await summarizeReviews(googleMapsInfo.reviews);
      console.log('评价总结:', reviewSummary);
    }

    // 使用 AI 生成其他信息（描述、设施、标签、难度、类型、价格、邮箱）
    const aiInfo = await generateCampInfoWithAI(name.trim(), description);
    
    // 使用 Google Maps 信息（如果可用），否则使用默认值或 AI 生成的值
    const finalRating = googleMapsInfo?.rating ?? 4.0;
    const finalAddress = googleMapsInfo?.address ?? aiInfo.address ?? undefined;
    const finalPhone = googleMapsInfo?.phone ?? aiInfo.phone ?? undefined;
    const finalWebsite = googleMapsInfo?.website ?? aiInfo.website ?? undefined;
    const finalLat = googleMapsInfo?.lat ?? aiInfo.lat;
    const finalLng = googleMapsInfo?.lng ?? aiInfo.lng;
    const finalRegion = googleMapsInfo?.region ?? aiInfo.region;
    
    // 合并设施信息：优先使用 Google Maps 推断的设施，然后使用 AI 生成的设施
    let finalFacilities = aiInfo.facilities || [];
    if (googleMapsInfo?.facilities && googleMapsInfo.facilities.length > 0) {
      // 合并 Google Maps 和 AI 的设施，去重
      finalFacilities = [...new Set([...googleMapsInfo.facilities, ...finalFacilities])];
    }

    // 生成营地 ID
    const campId = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    return NextResponse.json({
      success: true,
      camp: {
        id: campId,
        name: name.trim(),
        region: finalRegion,
        price: aiInfo.price,
        tags: aiInfo.tags,
        lat: finalLat,
        lng: finalLng,
        description: aiInfo.description,
        facilities: finalFacilities, // 使用合并后的设施列表
        difficulty: aiInfo.difficulty,
        rating: finalRating, // 从 Google Maps 获取
        campType: aiInfo.campType,
        // 联系方式（优先从 Google Maps 获取）
        address: finalAddress,
        phone: finalPhone,
        email: aiInfo.email, // 邮箱由 AI 生成（Google Maps 不提供）
        website: finalWebsite,
        // 评价总结（从 Google Maps 评价中提取）
        reviewPros: reviewSummary?.pros || undefined,
        reviewCons: reviewSummary?.cons || undefined,
      },
    });
  } catch (error: any) {
    console.error('获取营地信息失败:', error);
    return NextResponse.json(
      { error: error.message || '获取营地信息失败，请检查 OpenAI API Key 配置' },
      { status: 500 }
    );
  }
}


