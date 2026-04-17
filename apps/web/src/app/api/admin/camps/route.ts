import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin-server';
import { getSupabaseClient } from '@/lib/supabase-server';

// 获取营地列表
export async function GET(request: NextRequest) {
  try {
    // 检查管理员权限
    const { isAdmin: isAdminUser, userId, error: authError } = await checkAdmin(request);
    if (!isAdminUser || !userId) {
      return NextResponse.json(
        { error: authError || '无权限访问' },
        { status: 403 }
      );
    }

    // 从请求头获取 token，确保 Supabase 客户端有正确的认证
    const authHeader = request.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '') || undefined;
    const supabase = getSupabaseClient(request, accessToken);
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase 未配置' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';        // ✨ 'pending' | 'published' | 'rejected' | 'archived' | 'all'
    const source = searchParams.get('source') || '';        // ✨ 'doc' | 'google' | 'manual'

    let query = supabase
      .from('camps')
      .select('*')
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,region.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // ✨ status 过滤(默认显示全部,UI 可传 status=pending 等)
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // ✨ source 过滤
    if (source && source !== 'all') {
      query = query.eq('source', source);
    }

    const { data: camps, error } = await query
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      console.error('获取营地列表失败:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // 获取总数(应用同样的过滤)
    let countQuery = supabase.from('camps').select('*', { count: 'exact', head: true });
    if (status && status !== 'all') countQuery = countQuery.eq('status', status);
    if (source && source !== 'all') countQuery = countQuery.eq('source', source);
    if (search) {
      countQuery = countQuery.or(`name.ilike.%${search}%,region.ilike.%${search}%,description.ilike.%${search}%`);
    }
    const { count } = await countQuery;

    // 转换数据格式（数据库 snake_case -> 前端 camelCase）
    const formattedCamps = (camps || []).map((camp: any) => ({
      ...camp,
      campType: camp.camp_type || camp.campType,
      // 联系方式
      address: camp.address || undefined,
      phone: camp.phone || undefined,
      email: camp.email || undefined,
      website: camp.website || undefined,
      // 评价
      reviewPros: camp.review_pros || camp.reviewPros || undefined,
      reviewCons: camp.review_cons || camp.reviewCons || undefined,
      reviewSummary: camp.review_summary || camp.reviewSummary || undefined,
      reviewAspects: camp.review_aspects || camp.reviewAspects || undefined,
      ratingCount: camp.rating_count || camp.ratingCount || undefined,
      // 政策
      petPolicy: camp.pet_policy || camp.petPolicy || undefined,
      campfirePolicy: camp.campfire_policy || camp.campfirePolicy || undefined,
      bookingRequired: camp.booking_required ?? camp.bookingRequired,
      bookingUrl: camp.booking_url || camp.bookingUrl || undefined,
      alcoholAllowed: camp.alcohol_allowed ?? camp.alcoholAllowed,
      // 描述新字段
      shortDescription: camp.short_description || camp.shortDescription || undefined,
      highlights: camp.highlights || undefined,
      // 地理增强
      nearestTown: camp.nearest_town || camp.nearestTown || undefined,
      subRegion: camp.sub_region || camp.subRegion || undefined,
      elevationM: camp.elevation_m ?? camp.elevationM,
      distanceToTownKm: camp.distance_to_town_km ?? camp.distanceToTownKm,
      // 价格细化
      pricePerNightNzd: camp.price_per_night_nzd ?? camp.pricePerNightNzd,
      priceUnit: camp.price_unit || camp.priceUnit || undefined,
      priceNotes: camp.price_notes || camp.priceNotes || undefined,
      // 容量
      totalSites: camp.total_sites ?? camp.totalSites,
      tentFriendly: camp.tent_friendly ?? camp.tentFriendly,
      campervanFriendly: camp.campervan_friendly ?? camp.campervanFriendly,
      poweredSitesAvailable: camp.powered_sites_available ?? camp.poweredSitesAvailable,
      cabinAvailable: camp.cabin_available ?? camp.cabinAvailable,
      maxStayNights: camp.max_stay_nights ?? camp.maxStayNights,
      // 季节
      yearRound: camp.year_round ?? camp.yearRound,
      seasonOpenMonth: camp.season_open_month ?? camp.seasonOpenMonth,
      seasonCloseMonth: camp.season_close_month ?? camp.seasonCloseMonth,
      // 资源
      photos: camp.photos || undefined,
      photoAttribution: camp.photo_attribution || camp.photoAttribution || undefined,
      // 元数据
      source: camp.source,
      sourceId: camp.source_id || camp.sourceId || undefined,
      googlePlaceId: camp.google_place_id || camp.googlePlaceId || undefined,
      status: camp.status,
      dataQualityScore: camp.data_quality_score ?? camp.dataQualityScore,
      importedAt: camp.imported_at || undefined,
      lastEnrichedAt: camp.last_enriched_at || undefined,
      lastVerifiedAt: camp.last_verified_at || undefined,
    }));

    return NextResponse.json({
      camps: formattedCamps,
      total: count || 0,
      page,
      limit,
    });
  } catch (error: any) {
    console.error('获取营地列表失败:', error);
    return NextResponse.json(
      { error: error.message || '获取营地列表失败' },
      { status: 500 }
    );
  }
}

// 创建或更新营地
export async function POST(request: NextRequest) {
  try {
    // 检查管理员权限
    const { isAdmin: isAdminUser, userId, error: authError } = await checkAdmin(request);
    if (!isAdminUser || !userId) {
      return NextResponse.json(
        { error: authError || '无权限访问' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { camp } = body;

    console.log('=== 保存营地 - 服务器端调试信息 ===');
    console.log('接收到的请求体:', JSON.stringify(body, null, 2));
    console.log('camp 对象:', camp ? '存在' : '不存在');

    if (!camp) {
      console.error('❌ 营地数据为空');
      return NextResponse.json(
        { error: '营地数据必填' },
        { status: 400 }
      );
    }

    console.log('camp 数据详情:', {
      id: camp.id,
      name: camp.name,
      region: camp.region,
      reviewPros: camp.reviewPros,
      reviewProsType: Array.isArray(camp.reviewPros) ? 'array' : typeof camp.reviewPros,
      reviewCons: camp.reviewCons,
      reviewConsType: Array.isArray(camp.reviewCons) ? 'array' : typeof camp.reviewCons,
    });

    // 从请求头获取 token
    const authHeader = request.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '') || undefined;
    const supabase = getSupabaseClient(request, accessToken);
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase 未配置' },
        { status: 503 }
      );
    }

    // 转换数据格式（前端格式 -> 数据库格式）
    const reviewProsValue = camp.reviewPros || camp.review_pros || [];
    const reviewConsValue = camp.reviewCons || camp.review_cons || [];

    console.log('评价字段转换前:', {
      reviewPros: camp.reviewPros,
      review_pros: camp.review_pros,
      reviewCons: camp.reviewCons,
      review_cons: camp.review_cons,
    });

    console.log('评价字段转换后:', {
      review_pros: reviewProsValue,
      review_prosType: Array.isArray(reviewProsValue) ? 'array' : typeof reviewProsValue,
      review_cons: reviewConsValue,
      review_consType: Array.isArray(reviewConsValue) ? 'array' : typeof reviewConsValue,
    });

    const campData: Record<string, any> = {
      id: camp.id,
      name: camp.name,
      slug: camp.slug || null,
      region: camp.region,
      price: camp.price,
      tags: camp.tags || [],
      lat: camp.lat,
      lng: camp.lng,
      description: camp.description,
      facilities: camp.facilities || [],
      difficulty: camp.difficulty,
      rating: camp.rating,
      camp_type: camp.campType || camp.camp_type || null,
      // ✨ 多源追踪
      source: camp.source || 'manual',
      source_id: camp.sourceId || camp.source_id || null,
      google_place_id: camp.googlePlaceId || camp.google_place_id || null,
      status: camp.status || 'published',  // 手动创建默认 published
      raw_data: camp.rawData || camp.raw_data || null,
      // 联系方式
      address: camp.address || null,
      phone: camp.phone || null,
      email: camp.email || null,
      website: camp.website || null,
      // 评价(JSONB)
      review_pros: reviewProsValue,
      review_cons: reviewConsValue,
      review_summary: camp.reviewSummary || camp.review_summary || null,
      review_aspects: camp.reviewAspects || camp.review_aspects || null,
      rating_count: camp.ratingCount ?? camp.rating_count ?? null,
      // 政策
      pet_policy: camp.petPolicy || camp.pet_policy || null,
      campfire_policy: camp.campfirePolicy || camp.campfire_policy || null,
      booking_required: camp.bookingRequired ?? camp.booking_required ?? null,
      booking_url: camp.bookingUrl || camp.booking_url || null,
      alcohol_allowed: camp.alcoholAllowed ?? camp.alcohol_allowed ?? null,
      // ✨ 描述新字段
      short_description: camp.shortDescription || camp.short_description || null,
      highlights: camp.highlights || [],
      // ✨ 地理增强
      nearest_town: camp.nearestTown || camp.nearest_town || null,
      sub_region: camp.subRegion || camp.sub_region || null,
      elevation_m: camp.elevationM ?? camp.elevation_m ?? null,
      distance_to_town_km: camp.distanceToTownKm ?? camp.distance_to_town_km ?? null,
      country_code: camp.countryCode || camp.country_code || 'NZ',
      // ✨ 价格细化
      price_per_night_nzd: camp.pricePerNightNzd ?? camp.price_per_night_nzd ?? null,
      price_unit: camp.priceUnit || camp.price_unit || null,
      price_notes: camp.priceNotes || camp.price_notes || null,
      // ✨ 容量
      total_sites: camp.totalSites ?? camp.total_sites ?? null,
      tent_friendly: camp.tentFriendly ?? camp.tent_friendly ?? null,
      campervan_friendly: camp.campervanFriendly ?? camp.campervan_friendly ?? null,
      powered_sites_available: camp.poweredSitesAvailable ?? camp.powered_sites_available ?? null,
      cabin_available: camp.cabinAvailable ?? camp.cabin_available ?? null,
      max_stay_nights: camp.maxStayNights ?? camp.max_stay_nights ?? null,
      // ✨ 季节
      year_round: camp.yearRound ?? camp.year_round ?? true,
      season_open_month: camp.seasonOpenMonth ?? camp.season_open_month ?? null,
      season_close_month: camp.seasonCloseMonth ?? camp.season_close_month ?? null,
      // ✨ 资源
      photos: camp.photos || [],
      photo_attribution: camp.photoAttribution || camp.photo_attribution || {},
      // ✨ 元数据
      data_quality_score: camp.dataQualityScore ?? camp.data_quality_score ?? null,
      // 手动保存时记为人工核验
      last_verified_at: new Date().toISOString(),
    };

    // 添加调试日志
    console.log('准备保存营地数据:', {
      id: campData.id,
      name: campData.name,
      review_pros: campData.review_pros,
      review_cons: campData.review_cons,
      review_pros_type: Array.isArray(campData.review_pros) ? 'array' : typeof campData.review_pros,
      review_cons_type: Array.isArray(campData.review_cons) ? 'array' : typeof campData.review_cons,
    });

    // 先检查表结构（调试用）
    try {
      const { data: tableInfo, error: tableError } = await supabase
        .from('camps')
        .select('id')
        .limit(0);
      
      if (tableError) {
        console.error('❌ 无法访问 camps 表:', tableError);
      } else {
        console.log('✅ camps 表可访问');
      }
    } catch (tableCheckError) {
      console.error('❌ 检查表结构失败:', tableCheckError);
    }

    console.log('准备执行 upsert，数据:', JSON.stringify(campData, null, 2));

    const { data, error } = await supabase
      .from('camps')
      .upsert(campData, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('❌ 保存营地失败 - 详细错误信息:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        fullError: JSON.stringify(error, null, 2),
        campDataKeys: Object.keys(campData),
        campData: {
          id: campData.id,
          name: campData.name,
          review_pros: campData.review_pros,
          review_prosType: Array.isArray(campData.review_pros) ? 'array' : typeof campData.review_pros,
          review_cons: campData.review_cons,
          review_consType: Array.isArray(campData.review_cons) ? 'array' : typeof campData.review_cons,
        },
      });

      // 如果是字段不存在的错误，提供更明确的提示
      if (error.code === '42703' || error.message?.includes('column') || error.message?.includes('字段')) {
        return NextResponse.json(
          { 
            error: `数据库字段错误: ${error.message}`,
            code: error.code,
            details: error.details,
            hint: error.hint || '请检查数据库表结构，确保 review_pros 和 review_cons 字段存在',
            suggestion: '请在 Supabase Dashboard 执行: ALTER TABLE camps ADD COLUMN IF NOT EXISTS review_pros TEXT[]; ALTER TABLE camps ADD COLUMN IF NOT EXISTS review_cons TEXT[];',
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { 
          error: error.message || '保存失败',
          code: error.code,
          details: error.details,
          hint: error.hint,
        },
        { status: 500 }
      );
    }

    console.log('✅ 营地保存成功:', {
      id: data.id,
      name: data.name,
      review_pros: data.review_pros,
      review_cons: data.review_cons,
      review_prosType: Array.isArray(data.review_pros) ? 'array' : typeof data.review_pros,
      review_consType: Array.isArray(data.review_cons) ? 'array' : typeof data.review_cons,
    });

    return NextResponse.json({
      success: true,
      camp: {
        ...data,
        campType: data.camp_type,
        reviewPros: data.review_pros,
        reviewCons: data.review_cons,
        petPolicy: data.pet_policy || undefined,
      },
    });
  } catch (error: any) {
    console.error('保存营地失败:', error);
    return NextResponse.json(
      { error: error.message || '保存营地失败' },
      { status: 500 }
    );
  }
}

// 删除营地
export async function DELETE(request: NextRequest) {
  try {
    // 检查管理员权限
    const { isAdmin: isAdminUser, userId, error: authError } = await checkAdmin(request);
    if (!isAdminUser || !userId) {
      return NextResponse.json(
        { error: authError || '无权限访问' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { campId } = body;

    if (!campId) {
      return NextResponse.json(
        { error: '营地ID必填' },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '') || undefined;
    const supabase = getSupabaseClient(request, accessToken);
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase 未配置' },
        { status: 503 }
      );
    }

    const { error } = await supabase
      .from('camps')
      .delete()
      .eq('id', campId);

    if (error) {
      console.error('删除营地失败:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '营地已删除',
    });
  } catch (error: any) {
    console.error('删除营地失败:', error);
    return NextResponse.json(
      { error: error.message || '删除营地失败' },
      { status: 500 }
    );
  }
}

// ✨ PATCH:批量更新 status(用于审核 approve/reject 等)
export async function PATCH(request: NextRequest) {
  try {
    const { isAdmin: isAdminUser, userId, error: authError } = await checkAdmin(request);
    if (!isAdminUser || !userId) {
      return NextResponse.json({ error: authError || '无权限访问' }, { status: 403 });
    }

    const body = await request.json();
    const { campIds, status } = body as { campIds: string[]; status: string };

    if (!Array.isArray(campIds) || campIds.length === 0) {
      return NextResponse.json({ error: 'campIds 必须是非空数组' }, { status: 400 });
    }
    if (!['pending', 'published', 'rejected', 'archived'].includes(status)) {
      return NextResponse.json(
        { error: 'status 必须是 pending/published/rejected/archived' },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '') || undefined;
    const supabase = getSupabaseClient(request, accessToken);
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase 未配置' }, { status: 503 });
    }

    const { data, error } = await supabase
      .from('camps')
      .update({
        status,
        last_verified_at: new Date().toISOString(),
      })
      .in('id', campIds)
      .select('id');

    if (error) {
      console.error('批量更新 status 失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      updated: data?.length ?? 0,
      ids: data?.map((d: any) => d.id) ?? [],
    });
  } catch (error: any) {
    console.error('批量更新 status 失败:', error);
    return NextResponse.json({ error: error.message ?? '失败' }, { status: 500 });
  }
}

