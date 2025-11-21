import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import campsData from '@/data/camps.json';
import type { Camp } from '@/types/camp';
import { getSupabaseClient } from '@/lib/supabase-server';

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY 环境变量未设置');
  }
  return new OpenAI({ apiKey });
}

// 模拟天气数据（包含时间段信息）
function getMockWeather(region: string, day: number) {
  const conditions = ['晴天', '多云', '小雨', '晴朗'];
  const temperatures = ['18-25°C', '15-22°C', '12-20°C', '20-28°C'];
  const nightTemperatures = ['8-12°C', '10-15°C', '5-10°C', '12-18°C'];
  
  const condition = conditions[Math.floor(Math.random() * conditions.length)];
  const temperature = temperatures[Math.floor(Math.random() * temperatures.length)];
  const nightTemp = nightTemperatures[Math.floor(Math.random() * nightTemperatures.length)];
  
  // 生成时间段天气提醒
  const timeBasedWarnings: Array<{ time: string; message: string }> = [];
  
  // 根据天气条件生成提醒
  if (condition === '小雨' || condition === '多云') {
    timeBasedWarnings.push({
      time: '15:00',
      message: '下午可能有阵雨，建议提前扎营',
    });
  }
  
  if (day === 1) {
    timeBasedWarnings.push({
      time: '13:30',
      message: '适合休息时间，可以安排午餐和短暂休息',
    });
  }
  
  // 晚上温度提醒
  const nightTempNum = parseInt(nightTemp.split('-')[0]);
  if (nightTempNum < 10) {
    timeBasedWarnings.push({
      time: '晚上',
      message: `晚上温度 ${nightTemp}，记得带保暖衣物`,
    });
  }
  
  // 风的情况
  if (Math.random() > 0.5) {
    timeBasedWarnings.push({
      time: '15:00',
      message: '下午风会变大，建议提前扎营',
    });
  }

  return {
    condition,
    temperature,
    nightTemperature: nightTemp,
    timeBasedWarnings,
  };
}

// 计算驾驶时间（分钟）- 返回数字以便计算时间点
function calculateDrivingTimeMinutes(origin: string, destination: string): number {
  // 这里应该调用地图API计算实际时间
  // 暂时返回模拟数据（分钟）
  const times = [150, 195, 105, 240]; // 2.5h, 3.25h, 1.75h, 4h
  return times[Math.floor(Math.random() * times.length)];
}

// 格式化时间（分钟转字符串）
function formatDrivingTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}分钟`;
  if (mins === 0) return `${hours}小时`;
  return `${hours}小时${mins}分钟`;
}

// 生成时间线
function generateTimeline(
  startTime: string, // "10:00"
  drivingMinutes: number,
  campName: string,
  preferences: string[]
): Array<{ time: string; event: string; type: 'departure' | 'arrival' | 'activity' | 'warning' }> {
  const timeline: Array<{ time: string; event: string; type: 'departure' | 'arrival' | 'activity' | 'warning' }> = [];
  
  // 解析出发时间
  const [startHour, startMin] = startTime.split(':').map(Number);
  let currentMinutes = startHour * 60 + startMin;
  
  // 出发
  timeline.push({
    time: startTime,
    event: '出发',
    type: 'departure',
  });
  
  // 到达时间
  currentMinutes += drivingMinutes;
  const arrivalHour = Math.floor(currentMinutes / 60);
  const arrivalMin = currentMinutes % 60;
  const arrivalTime = `${String(arrivalHour).padStart(2, '0')}:${String(arrivalMin).padStart(2, '0')}`;
  
  timeline.push({
    time: arrivalTime,
    event: `到达 ${campName}`,
    type: 'arrival',
  });
  
  // 根据偏好添加活动
  if (preferences.includes('family') || preferences.includes('适合带娃')) {
    // 小孩午睡时间
    timeline.push({
      time: '13:30',
      event: '适合小孩午睡时间，可以安排休息',
      type: 'activity',
    });
  }
  
  // 午餐时间
  if (arrivalHour < 12) {
    timeline.push({
      time: '12:30',
      event: '午餐时间',
      type: 'activity',
    });
  }
  
  return timeline;
}

// 安全解析 JSON，处理可能包含 markdown 代码块的情况
function safeParseJSON(content: string): any {
  try {
    // 尝试直接解析
    return JSON.parse(content);
  } catch {
    // 如果失败，尝试提取 JSON 代码块
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    // 尝试提取第一个 { ... } 块
    const braceMatch = content.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      return JSON.parse(braceMatch[0]);
    }
    return {};
  }
}

// 生成默认的每日提醒
function generateDefaultNotes(dailyPlan: any, day: number): Array<{ time?: string; message: string }> {
  const notes: Array<{ time?: string; message: string }> = [];
  
  // 根据时间线生成提醒
  const timeline = dailyPlan.timeline || [];
  const departure = timeline.find((t: any) => t.type === 'departure');
  const arrival = timeline.find((t: any) => t.type === 'arrival');
  
  if (departure) {
    notes.push({
      time: departure.time,
      message: `上午${departure.time}出发，记得带好水和小吃，路上可别饿着哦！`,
    });
  }
  
  if (arrival) {
    notes.push({
      time: arrival.time,
      message: `预计${arrival.time}到达${dailyPlan.camp.name}，别忘了带上相机，美景绝对值得一拍！`,
    });
  }
  
  // 根据天气添加提醒
  if (dailyPlan.weather?.timeBasedWarnings) {
    dailyPlan.weather.timeBasedWarnings.forEach((warning: any) => {
      notes.push({
        time: warning.time,
        message: warning.message,
      });
    });
  }
  
  if (dailyPlan.weather?.nightTemperature) {
    const nightTemp = dailyPlan.weather.nightTemperature;
    notes.push({
      message: `晚上温度${nightTemp}，记得带保暖衣物，聊天的时候也能保持温暖哦！`,
    });
  }
  
  // 如果没有生成任何提醒，添加通用提醒
  if (notes.length === 0) {
    notes.push({
      message: `第${day}天行程，记得带好必需品，注意安全！`,
    });
  }
  
  return notes;
}

// 加载营地数据（从 Supabase 或 JSON 后备）
async function loadCampsData(): Promise<Camp[]> {
  try {
    const supabase = getSupabaseClient(new NextRequest('http://localhost'));
    if (supabase) {
      const { data, error } = await supabase
        .from('camps')
        .select('*');
      
      if (!error && data && data.length > 0) {
        // 转换为前端格式
        return data.map((camp: any) => ({
          id: camp.id,
          name: camp.name,
          region: camp.region,
          price: parseFloat(camp.price),
          tags: camp.tags || [],
          lat: parseFloat(camp.lat),
          lng: parseFloat(camp.lng),
          description: camp.description,
          facilities: camp.facilities || [],
          difficulty: camp.difficulty,
          rating: parseFloat(camp.rating),
          campType: camp.camp_type || undefined,
        }));
      }
    }
  } catch (error) {
    console.error('从 Supabase 加载营地失败，使用 JSON 后备:', error);
  }
  
  // 使用 JSON 数据作为后备
  return campsData as Camp[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { origin, destination, days, preferences, campId, selectedCampIds, tripType, campCount, userPreferences, onboardingData } = body;

    if (!origin || !days) {
      return NextResponse.json(
        { error: '出发地和天数必填' },
        { status: 400 }
      );
    }

    // 加载营地数据
    const allCamps = await loadCampsData();

    let selectedCamps: Camp[] = [];

    // 如果指定了营地ID，直接使用（优先）
    if (campId) {
      const camp = allCamps.find((c: Camp) => c.id === campId);
      if (camp) {
        selectedCamps = [camp];
      }
    }

    // 如果有已选择的营地列表，也加入推荐考虑
    const priorityCampIds: string[] = [];
    if (selectedCampIds && Array.isArray(selectedCampIds)) {
      selectedCampIds.forEach((id: string) => {
        if (id !== campId) {
          // 避免重复添加已指定的营地
          priorityCampIds.push(id);
        }
      });
    }

    // 根据行程类型决定推荐逻辑（优先使用campCount，兼容tripType）
    const targetCampCount = campCount || (tripType === 'single' ? 1 : days);
    const isSingleCamp = targetCampCount === 1;

    // 使用引导数据或用户偏好
    const userData = onboardingData || userPreferences;
    const preferredCampTypes = userData?.campTypes || [];
    const userPeople = userData?.personalInfo?.people || userData?.people || 2;

    // 如果没有指定或需要推荐更多，使用AI推荐
    if (selectedCamps.length < targetCampCount) {
      const systemPrompt = isSingleCamp
        ? `你是新西兰户外露营专家。用户想要在单个营地待 ${days} 天，请推荐 1 个最适合的营地。

返回 JSON 格式：
{
  "camps": ["营地ID"],
  "notes": ["注意事项1", "注意事项2", ...]
}`
        : `你是新西兰户外露营专家。根据用户需求推荐 ${days} 个最合适的营地。

返回 JSON 格式：
{
  "camps": ["营地ID1", "营地ID2", ...],
  "notes": ["注意事项1", "注意事项2", ...]
}`;

      const userPrompt = `用户需求：
- 出发地: ${origin}
${destination ? `- 目的地: ${destination}` : ''}
- 天数: ${days} 天
- 行程类型: ${isSingleCamp ? '单个营地多天' : '多个营地'}
- 偏好: ${preferences.join('、')}
${priorityCampIds.length > 0 ? `- 用户已选择的营地（请优先考虑）: ${priorityCampIds.map((id) => {
  const camp = allCamps.find((c: Camp) => c.id === id);
  return camp ? `${camp.name} (${id})` : id;
}).join('、')}` : ''}
${selectedCamps.length > 0 ? `- 已确定的营地: ${selectedCamps.map((c) => c.name).join('、')}` : ''}

可用营地：
${JSON.stringify(allCamps, null, 2)}

${priorityCampIds.length > 0 ? '重要：用户已选择了部分营地，请优先推荐这些营地，然后根据偏好补充其他营地。' : ''}
${isSingleCamp ? `请推荐 1 个最适合待 ${days} 天的营地，并生成注意事项。` : `请推荐 ${days} 个营地，并生成注意事项。`}`;

      let recommendedCampIds: string[] = [];
      let notes: string[] = [];

      if (process.env.OPENAI_API_KEY) {
        try {
          const openai = getOpenAIClient();
          const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.7,
          });

          const result = safeParseJSON(response.choices[0].message.content || '{}');
          recommendedCampIds = result.camps || [];
          notes = result.notes || [];
        } catch (error) {
          console.error('AI推荐失败:', error);
        }
      }

      // 如果没有AI推荐，使用默认逻辑
      if (recommendedCampIds.length === 0) {
        // 优先考虑已选择的营地
        const priorityCamps = priorityCampIds
          .map((id) => allCamps.find((c: Camp) => c.id === id))
          .filter((c: Camp | undefined): c is Camp => c !== undefined);

        // 然后根据偏好和目的地筛选其他营地
        const filteredCamps = allCamps
          .filter((camp) => {
            // 排除已选择的营地，避免重复
            if (selectedCamps.some((c) => c.id === camp.id)) return false;
            if (priorityCampIds.includes(camp.id)) return false;
            
            // 如果指定了目的地，只选择该地区的营地
            if (destination && camp.region !== destination) return false;
            
            // 偏好筛选
            if (preferences.includes('beach') && !camp.tags.includes('海边')) return false;
            if (preferences.includes('forest') && !camp.tags.some((t) => t.includes('徒步'))) return false;
            if (preferences.includes('toilet') && !camp.facilities.includes('厕所')) return false;
            if (preferences.includes('family') && camp.difficulty === 'hard') return false;
            return true;
          });

        // 优先使用已选择的营地，然后补充其他营地
        const neededCount = targetCampCount - selectedCamps.length;
        recommendedCampIds = [
          ...priorityCamps.slice(0, neededCount).map((c) => c.id),
          ...filteredCamps.slice(0, Math.max(0, neededCount - priorityCamps.length)).map((c) => c.id),
        ];
        
        notes = ['建议提前预订营地', '注意天气变化', '带好防蚊用品'];
      }

      // 获取完整营地信息
      const recommendedCamps = allCamps.filter((c) =>
        recommendedCampIds.includes(c.id)
      );

      // 合并已选择的营地和推荐的营地，优先使用已选择的
      const finalCamps = [...selectedCamps];
      
      // 添加推荐的营地（排除已选择的）
      recommendedCamps.forEach((camp) => {
        if (!finalCamps.some((c) => c.id === camp.id)) {
          finalCamps.push(camp);
        }
      });

      // 如果还有已选择的营地未添加，优先添加
      if (priorityCampIds.length > 0) {
        priorityCampIds.forEach((id) => {
          const camp = allCamps.find((c: Camp) => c.id === id);
          if (camp && !finalCamps.some((c) => c.id === camp.id) && finalCamps.length < days) {
            finalCamps.push(camp);
          }
        });
      }

      // 根据campCount限制营地数量
      selectedCamps = finalCamps.slice(0, targetCampCount);

      // 根据campCount限制营地数量
      selectedCamps = allCamps.slice(0, targetCampCount);
    }

    // 确保 selectedCamps 是数组
    if (!selectedCamps || selectedCamps.length === 0) {
      return NextResponse.json(
        { error: '未找到合适的营地，请调整筛选条件' },
        { status: 400 }
      );
    }

    // 生成每日行程数据（包含时间线）
    let dailyPlans: any[];
    
    if (isSingleCamp && selectedCamps.length === 1) {
      // 单个营地多天：同一个营地，生成多天的行程
      const camp = selectedCamps[0];
      dailyPlans = Array.from({ length: days }, (_, index) => {
        const day = index + 1;
        
        // 计算驾驶时间（只有第一天需要）
        // 如果指定了destination，从destination出发；否则从origin出发
        let drivingMinutes: number;
        if (day === 1) {
          const startLocation = destination || origin;
          drivingMinutes = calculateDrivingTimeMinutes(startLocation, camp.region);
        } else {
          // 后续天数不需要驾驶时间（在同一个营地）
          drivingMinutes = 0;
        }
        
        // 生成时间线
        const startTime = day === 1 ? '10:00' : '09:00';
        let timeline: any[];
        if (day === 1) {
          // 第一天：包含出发和到达
          timeline = generateTimeline(startTime, drivingMinutes, camp.name, preferences);
        } else {
          // 后续天数：在营地内的活动安排
          timeline = [
            { time: '09:00', event: '营地活动', type: 'activity' as const },
            { time: '12:00', event: '午餐时间', type: 'activity' as const },
            { time: '15:00', event: '探索周边', type: 'activity' as const },
            { time: '18:00', event: '晚餐准备', type: 'activity' as const },
          ];
        }
        
        // 获取天气信息
        const weather = getMockWeather(camp.region, day);
        
        return {
          camp,
          day,
          drivingTime: day === 1 ? formatDrivingTime(drivingMinutes) : '无需驾驶',
          drivingMinutes,
          timeline,
          weather,
        };
      });
    } else {
      // 多个营地：每天一个营地
      dailyPlans = selectedCamps.map((camp, index) => {
        const day = index + 1;
        
        // 计算驾驶时间（分钟）
        // 如果指定了destination，第一天从destination出发；否则从origin出发
        // 最后一天考虑回到origin（如果指定了origin）
        let drivingMinutes: number;
        if (index === 0) {
          const startLocation = destination || origin;
          drivingMinutes = calculateDrivingTimeMinutes(startLocation, camp.region);
        } else if (index === selectedCamps.length - 1 && origin) {
          // 最后一天：从上一个营地到当前营地，然后考虑回到origin
          const toCamp = calculateDrivingTimeMinutes(
            selectedCamps[index - 1].region,
            camp.region
          );
          const backToOrigin = calculateDrivingTimeMinutes(camp.region, origin);
          // 这里可以添加提示，但驾驶时间只显示到营地的
          drivingMinutes = toCamp;
        } else {
          drivingMinutes = calculateDrivingTimeMinutes(
            selectedCamps[index - 1].region,
            camp.region
          );
        }
        
        // 生成时间线（第一天10:00出发，后续根据前一天安排）
        const startTime = index === 0 ? '10:00' : '09:00';
        const timeline = generateTimeline(startTime, drivingMinutes, camp.name, preferences);
        
        // 获取天气信息（包含时间段提醒）
        const weather = getMockWeather(camp.region, day);
        
        return {
          camp,
          day,
          drivingTime: formatDrivingTime(drivingMinutes),
          drivingMinutes,
          timeline,
          weather,
        };
      });
    }

    // 为每一天生成独立的AI注意事项（包含时间点的贴心提醒）
    if (process.env.OPENAI_API_KEY && selectedCamps.length > 0) {
      try {
        const openai = getOpenAIClient();
        
        // 为每一天生成独立的提醒
        for (let i = 0; i < dailyPlans.length; i++) {
          const dailyPlan = dailyPlans[i];
          const day = i + 1;
          
          try {
            const notesPrompt = `你是新西兰当地资深私导，根据第${day}天的行程生成贴心、实用的注意事项。要求：
1. 像熟悉当地的朋友一样，给出具体时间点的提醒
2. 语气轻松、自然、有温度
3. 包含具体时间（如：上午10:00、下午15:00、晚上等）
4. 考虑用户偏好：${preferences.join('、')}
5. 只生成第${day}天的提醒，不要包含其他天的内容

第${day}天行程信息：
- 营地: ${dailyPlan.camp.name}
- 地区: ${dailyPlan.camp.region}
- 时间线: ${dailyPlan.timeline.map((t: { time: string; event: string }) => `${t.time} ${t.event}`).join('，')}
- 天气: ${dailyPlan.weather.condition} ${dailyPlan.weather.temperature}
${dailyPlan.weather.nightTemperature ? `- 夜间温度: ${dailyPlan.weather.nightTemperature}` : ''}
${dailyPlan.drivingTime && dailyPlan.drivingTime !== '无需驾驶' ? `- 驾驶时间: ${dailyPlan.drivingTime}` : ''}

返回 JSON 格式：
{
  "notes": [
    {"time": "10:00", "message": "上午10:00出发，记得带好..."},
    {"time": "15:00", "message": "下午15:00风会变大，建议提前扎营"},
    {"message": "晚上温度较低，记得带保暖衣物"}
  ]
}

注意：有些提醒可以没有具体时间，直接是message。只生成第${day}天的提醒。`;

            const response = await openai.chat.completions.create({
              model: 'gpt-4o-mini',
              messages: [
                { 
                  role: 'system', 
                  content: '你是新西兰户外露营专家和当地私导，用轻松、贴心的语气生成包含时间点的注意事项，让用户感觉你像熟悉当地的朋友。只生成指定当天的提醒，不要包含其他天的内容。' 
                },
                { role: 'user', content: notesPrompt },
              ],
              temperature: 0.8,
            });

            const result = safeParseJSON(response.choices[0].message.content || '{}');
            dailyPlan.notes = result.notes || [];
          } catch (error) {
            console.error(`生成第${day}天注意事项失败:`, error);
            // 使用默认提醒
            dailyPlan.notes = generateDefaultNotes(dailyPlan, day);
          }
        }
      } catch (error) {
        console.error('生成注意事项失败:', error);
        // 如果全部失败，为每一天生成默认提醒
        dailyPlans.forEach((plan, index) => {
          plan.notes = generateDefaultNotes(plan, index + 1);
        });
      }
    } else {
      // 没有 OpenAI API Key，为每一天生成默认提醒
      dailyPlans.forEach((plan, index) => {
        plan.notes = generateDefaultNotes(plan, index + 1);
      });
    }

    // 确保 dailyPlans 是数组
    const formattedDailyPlans = (dailyPlans || []).map(({ camp, day, drivingTime, timeline, weather, notes }) => ({
      camp,
      day,
      drivingTime: drivingTime || '0小时',
      timeline: timeline || [],
      weather: weather || {
        condition: '未知',
        temperature: '未知',
      },
      notes: notes || [],
    }));

    const tripPlan = {
      id: `trip-${Date.now()}`,
      origin,
      days,
      dailyPlans: formattedDailyPlans,
      notes: [], // 保留全局 notes 字段以兼容旧数据，但新数据使用 dailyPlans[].notes
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(tripPlan);
  } catch (error) {
    console.error('生成行程失败:', error);
    return NextResponse.json(
      { error: '生成行程失败，请稍后重试' },
      { status: 500 }
    );
  }
}

