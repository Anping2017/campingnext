import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';
import campsData from '@/data/camps.json';

// 将数字价格转换为分类
function priceToCategory(price: number): 'free' | 'cheap' | 'medium' | 'expensive' {
  if (price === 0) return 'free';
  if (price <= 15) return 'cheap';
  if (price <= 30) return 'medium';
  return 'expensive';
}

// 从本地 JSON 数据中查找营地
function findLocalCamp(campId: string): any | null {
  const camps = campsData as any[];
  const camp = camps.find((c) => c.id === campId);
  if (!camp) return null;

  // 转换为前端格式
  return {
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
    campType: camp.campType || undefined,
    // 本地数据可能没有这些字段
    address: camp.address || undefined,
    phone: camp.phone || undefined,
    email: camp.email || undefined,
    website: camp.website || undefined,
    reviewPros: camp.reviewPros || undefined,
    reviewCons: camp.reviewCons || undefined,
    petPolicy: camp.petPolicy || undefined,
  };
}

// 获取单个营地信息
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseClient(request);

    // 尝试从 Supabase 获取数据
    if (supabase) {
      try {
        const { data: camp, error } = await supabase
          .from('camps')
          .select('*')
          .eq('id', params.id)
          .single();

        if (!error && camp) {
          // 转换为前端格式
          const formattedCamp = {
            id: camp.id,
            name: camp.name,
            region: camp.region,
            price: camp.price as 'free' | 'cheap' | 'medium' | 'expensive',
            tags: camp.tags || [],
            lat: typeof camp.lat === 'string' ? parseFloat(camp.lat) : camp.lat,
            lng: typeof camp.lng === 'string' ? parseFloat(camp.lng) : camp.lng,
            description: camp.description,
            facilities: camp.facilities || [],
            difficulty: camp.difficulty,
            rating: typeof camp.rating === 'string' ? parseFloat(camp.rating) : camp.rating,
            campType: camp.camp_type || undefined,
            // 联系方式
            address: camp.address || undefined,
            phone: camp.phone || undefined,
            email: camp.email || undefined,
            website: camp.website || undefined,
            // 评价总结
            reviewPros: camp.review_pros || undefined,
            reviewCons: camp.review_cons || undefined,
            // 宠物政策
            petPolicy: camp.pet_policy || undefined,
          };

          return NextResponse.json(formattedCamp);
        }

        // 如果是"未找到"错误，继续尝试本地数据
        if (error && error.code === 'PGRST116') {
          // 继续到本地数据查找
        } else if (error) {
          // 其他错误，记录并尝试本地数据
          const errorMessage = error.message || String(error);
          const isNetworkError = errorMessage.includes('ENOTFOUND') || 
                                errorMessage.includes('getaddrinfo') ||
                                errorMessage.includes('fetch failed');
          
          if (isNetworkError) {
            console.warn('Supabase 网络连接失败，使用本地数据:', errorMessage);
          } else {
            console.warn('Supabase 查询失败，使用本地数据:', errorMessage);
          }
        }
      } catch (supabaseError: any) {
        // 捕获网络错误（如 DNS 解析失败）
        const errorMessage = supabaseError.message || String(supabaseError);
        const isNetworkError = errorMessage.includes('ENOTFOUND') || 
                              errorMessage.includes('getaddrinfo') ||
                              errorMessage.includes('fetch failed');
        
        if (isNetworkError) {
          console.warn('Supabase 网络连接失败，使用本地数据:', errorMessage);
        } else {
          console.warn('Supabase 连接失败，使用本地数据:', errorMessage);
        }
      }
    }

    // 使用本地 JSON 数据作为后备
    const localCamp = findLocalCamp(params.id);
    if (localCamp) {
      return NextResponse.json(localCamp);
    }

    // 本地数据中也没有找到
    return NextResponse.json(
      { error: '营地不存在' },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('获取营地失败:', error);
    // 即使出错也尝试返回本地数据
    try {
      const localCamp = findLocalCamp(params.id);
      if (localCamp) {
        return NextResponse.json(localCamp);
      }
    } catch (fallbackError) {
      // 忽略后备错误
    }
    
    return NextResponse.json(
      { error: '获取营地失败，请重试' },
      { status: 500 }
    );
  }
}

