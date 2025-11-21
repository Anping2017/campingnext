'use client';

import { Clock, MapPin, Calendar, AlertCircle, Cloud } from 'lucide-react';
import { Camp } from '@/types/camp';
import { formatPrice } from '@/utils/format';

interface TimelineItem {
  time: string;
  event: string;
  type: 'departure' | 'arrival' | 'activity' | 'warning';
}

interface TripCardProps {
  camp: Camp;
  day: number;
  drivingTime?: string;
  timeline?: TimelineItem[];
  weather?: {
    condition: string;
    temperature: string;
    nightTemperature?: string;
    timeBasedWarnings?: Array<{ time: string; message: string }>;
  };
  notes?: Array<{ time?: string; message: string }>;
}

export default function TripCard({
  camp,
  day,
  drivingTime,
  timeline,
  weather,
  notes,
}: TripCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      {/* 日期标签 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-green-600" />
          <span className="font-semibold text-gray-900">第 {day} 天</span>
        </div>
        {weather && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Cloud className="w-4 h-4" />
            <span>{weather.condition}</span>
            <span className="font-medium">{weather.temperature}</span>
          </div>
        )}
      </div>

      {/* 营地信息 */}
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{camp.name}</h3>
        <div className="flex items-center gap-2 text-gray-600 mb-2">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">{camp.region}</span>
        </div>
        <p className="text-gray-700 text-sm mb-3">{camp.description}</p>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-green-600 font-medium">{formatPrice(camp.price)}</span>
          <span className="text-gray-500">评分 {camp.rating}</span>
        </div>
      </div>

      {/* 驾驶时间 */}
      {drivingTime && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 rounded-lg">
          <Clock className="w-5 h-5 text-blue-600" />
          <div>
            <div className="text-xs text-gray-500">预计驾驶时间</div>
            <div className="font-semibold text-blue-700">{drivingTime}</div>
          </div>
        </div>
      )}

      {/* 时间线 */}
      {timeline && timeline.length > 0 && (
        <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-100">
          <div className="text-sm font-medium text-gray-700 mb-3">行程时间线</div>
          <div className="space-y-2">
            {timeline.map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-16 text-sm font-semibold text-blue-700">
                  {item.time}
                </div>
                <div className="flex-1 text-sm text-gray-700">
                  {item.event}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 天气提醒（时间段） */}
      {weather?.timeBasedWarnings && weather.timeBasedWarnings.length > 0 && (
        <div className="mb-4 space-y-2">
          {weather.timeBasedWarnings.map((warning, index) => (
            <div key={index} className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-amber-900">
                    {warning.time} 提醒
                  </div>
                  <div className="text-sm text-amber-800">{warning.message}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 夜间温度提醒 */}
      {weather?.nightTemperature && (
        <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-purple-900">夜间温度</div>
              <div className="text-sm text-purple-800">
                晚上温度 {weather.nightTemperature}，记得带保暖衣物
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 注意事项（包含时间点） */}
      {notes && notes.length > 0 && (
        <div className="pt-4 border-t border-gray-200">
          <div className="text-sm font-medium text-gray-700 mb-2">贴心提醒</div>
          <ul className="space-y-2">
            {notes.map((note, index) => (
              <li key={index} className="text-sm text-gray-700 flex items-start gap-2 bg-green-50 p-2 rounded">
                {note.time && (
                  <span className="font-semibold text-green-700 flex-shrink-0 w-16">
                    {note.time}
                  </span>
                )}
                <span className="flex-1">{note.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

