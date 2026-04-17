import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';
import campsData from '@/data/camps.json';

/**
 * 数据库行(snake_case)→ 前端格式(camelCase + 类型修正)
 */
function formatCampForFrontend(camp: any) {
  return {
    ...camp,
    // 类型修正
    lat: typeof camp.lat === 'string' ? parseFloat(camp.lat) : camp.lat,
    lng: typeof camp.lng === 'string' ? parseFloat(camp.lng) : camp.lng,
    rating: typeof camp.rating === 'string' ? parseFloat(camp.rating) : camp.rating,
    // snake → camel(为前端组件兼容)
    campType: camp.camp_type ?? camp.campType,
    shortDescription: camp.short_description ?? camp.shortDescription,
    nearestTown: camp.nearest_town ?? camp.nearestTown,
    subRegion: camp.sub_region ?? camp.subRegion,
    elevationM: camp.elevation_m ?? camp.elevationM,
    distanceToTownKm: camp.distance_to_town_km ?? camp.distanceToTownKm,
    pricePerNightNzd: camp.price_per_night_nzd ?? camp.pricePerNightNzd,
    priceUnit: camp.price_unit ?? camp.priceUnit,
    priceNotes: camp.price_notes ?? camp.priceNotes,
    totalSites: camp.total_sites ?? camp.totalSites,
    tentFriendly: camp.tent_friendly ?? camp.tentFriendly,
    campervanFriendly: camp.campervan_friendly ?? camp.campervanFriendly,
    poweredSitesAvailable: camp.powered_sites_available ?? camp.poweredSitesAvailable,
    cabinAvailable: camp.cabin_available ?? camp.cabinAvailable,
    maxStayNights: camp.max_stay_nights ?? camp.maxStayNights,
    yearRound: camp.year_round ?? camp.yearRound,
    seasonOpenMonth: camp.season_open_month ?? camp.seasonOpenMonth,
    seasonCloseMonth: camp.season_close_month ?? camp.seasonCloseMonth,
    bookingRequired: camp.booking_required ?? camp.bookingRequired,
    bookingUrl: camp.booking_url ?? camp.bookingUrl,
    petPolicy: camp.pet_policy ?? camp.petPolicy,
    campfirePolicy: camp.campfire_policy ?? camp.campfirePolicy,
    alcoholAllowed: camp.alcohol_allowed ?? camp.alcoholAllowed,
    ratingCount: camp.rating_count ?? camp.ratingCount,
    reviewPros: camp.review_pros ?? camp.reviewPros,
    reviewCons: camp.review_cons ?? camp.reviewCons,
    reviewSummary: camp.review_summary ?? camp.reviewSummary,
    reviewAspects: camp.review_aspects ?? camp.reviewAspects,
    photoAttribution: camp.photo_attribution ?? camp.photoAttribution,
    googlePlaceId: camp.google_place_id ?? camp.googlePlaceId,
    dataQualityScore: camp.data_quality_score ?? camp.dataQualityScore,
    sourceId: camp.source_id ?? camp.sourceId,
    importedAt: camp.imported_at ?? camp.importedAt,
    lastEnrichedAt: camp.last_enriched_at ?? camp.lastEnrichedAt,
    lastVerifiedAt: camp.last_verified_at ?? camp.lastVerifiedAt,
  };
}

// 将数字价格转换为分类
function priceToCategory(price: number): 'free' | 'cheap' | 'medium' | 'expensive' {
  if (price === 0) return 'free';
  if (price <= 15) return 'cheap';
  if (price <= 30) return 'medium';
  return 'expensive';
}

// 从本地 JSON 数据筛选营地
function filterLocalCamps(
  camps: any[],
  region?: string | null,
  campType?: string | null,
  difficulty?: string | null,
  minPrice?: string | null,
  maxPrice?: string | null
) {
  let filtered = [...camps];

  if (region) {
    filtered = filtered.filter((camp) => camp.region === region);
  }
  if (campType) {
    filtered = filtered.filter((camp) => camp.campType === campType);
  }
  if (difficulty) {
    filtered = filtered.filter((camp) => camp.difficulty === difficulty);
  }
  if (minPrice || maxPrice) {
    const priceOrder = ['free', 'cheap', 'medium', 'expensive'];
    filtered = filtered.filter((camp) => {
      const campPrice = priceToCategory(camp.price);
      const campPriceIndex = priceOrder.indexOf(campPrice);
      
      if (minPrice) {
        const minIndex = priceOrder.indexOf(minPrice);
        if (minIndex >= 0 && campPriceIndex < minIndex) return false;
      }
      if (maxPrice) {
        const maxIndex = priceOrder.indexOf(maxPrice);
        if (maxIndex >= 0 && campPriceIndex > maxIndex) return false;
      }
      return true;
    });
  }

  // 按评分排序
  filtered.sort((a, b) => b.rating - a.rating);

  // 转换为数据库格式（但保持数字类型）
  return filtered.map((camp) => ({
    id: camp.id,
    name: camp.name,
    region: camp.region,
    price: priceToCategory(camp.price),
    tags: camp.tags || [],
    lat: typeof camp.lat === 'string' ? parseFloat(camp.lat) : camp.lat,
    lng: typeof camp.lng === 'string' ? parseFloat(camp.lng) : camp.lng,
    description: camp.description,
    facilities: camp.facilities || [],
    difficulty: camp.difficulty,
    rating: typeof camp.rating === 'string' ? parseFloat(camp.rating) : camp.rating,
    camp_type: camp.campType || null,
  }));
}

// 获取营地列表
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient(request);
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region');
    const campType = searchParams.get('campType');
    const difficulty = searchParams.get('difficulty');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');

    // 尝试从 Supabase 获取数据
    if (supabase) {
      try {
        // 🔒 公开端点只返回 status='published' 的营地
        // 兼容旧数据(status 为 NULL 的也展示,等迁移完成后可去掉 OR 子句)
        let query = supabase
          .from('camps')
          .select('*')
          .or('status.eq.published,status.is.null');

        if (region) {
          query = query.eq('region', region);
        }
        if (campType) {
          query = query.eq('camp_type', campType);
        }
        if (difficulty) {
          query = query.eq('difficulty', difficulty);
        }
        // 价格筛选改为分类筛选
        if (minPrice || maxPrice) {
          // 价格分类筛选：free < cheap < medium < expensive
          const priceOrder = ['free', 'cheap', 'medium', 'expensive'];
          if (minPrice) {
            const minIndex = priceOrder.indexOf(minPrice);
            if (minIndex >= 0) {
              query = query.in('price', priceOrder.slice(minIndex));
            }
          }
          if (maxPrice) {
            const maxIndex = priceOrder.indexOf(maxPrice);
            if (maxIndex >= 0) {
              query = query.in('price', priceOrder.slice(0, maxIndex + 1));
            }
          }
        }

        // 排序:质量高优先,然后评分高优先
        const { data, error } = await query
          .order('data_quality_score', { ascending: false, nullsFirst: false })
          .order('rating', { ascending: false });

        if (!error && data && data.length > 0) {
          // 转换 snake_case → camelCase + 数值类型
          const formattedData = data.map(formatCampForFrontend);
          return NextResponse.json({ camps: formattedData });
        }

        // 如果 Supabase 返回错误或空数据，使用本地数据作为后备
        if (error) {
          console.warn('Supabase 查询失败，使用本地数据:', error.message);
        }
      } catch (supabaseError: any) {
        // 捕获网络错误（如 DNS 解析失败）
        const errorMessage = supabaseError.message || String(supabaseError);
        const isNetworkError = errorMessage.includes('ENOTFOUND') || 
                              errorMessage.includes('getaddrinfo') ||
                              errorMessage.includes('fetch failed');
        
        if (isNetworkError) {
          console.warn('Supabase 网络连接失败（可能是 DNS 解析问题或网络不可达），使用本地数据:', errorMessage);
        } else {
          console.warn('Supabase 连接失败，使用本地数据:', errorMessage);
        }
      }
    }

    // 使用本地 JSON 数据作为后备
    const localCamps = filterLocalCamps(
      campsData as any[],
      region,
      campType,
      difficulty,
      minPrice,
      maxPrice
    );

    return NextResponse.json({ camps: localCamps });
  } catch (error: any) {
    console.error('获取营地失败:', error);
    // 即使出错也尝试返回本地数据
    try {
      const localCamps = filterLocalCamps(campsData as any[]);
      return NextResponse.json({ camps: localCamps });
    } catch (fallbackError) {
      return NextResponse.json(
        { error: '获取营地失败，请重试' },
        { status: 500 }
      );
    }
  }
}

// 创建或更新营地（用于初始化数据）
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient(request);
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase 未配置' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { camps } = body;

    if (!Array.isArray(camps)) {
      return NextResponse.json(
        { error: 'camps 必须是数组' },
        { status: 400 }
      );
    }

    // 批量插入或更新营地
    const { data, error } = await supabase
      .from('camps')
      .upsert(camps, { onConflict: 'id' });

    if (error) {
      console.error('保存营地失败:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, count: camps.length });
  } catch (error: any) {
    console.error('保存营地失败:', error);
    return NextResponse.json(
      { error: '保存营地失败，请重试' },
      { status: 500 }
    );
  }
}

