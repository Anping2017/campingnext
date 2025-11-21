'use client';

interface CampMapProps {
  lat: number;
  lng: number;
  name: string;
}

export default function CampMap({ lat, lng, name }: CampMapProps) {
  const googleMapUrl = `https://www.google.com/maps?q=${lat},${lng}&hl=zh-CN`;

  return (
    <div className="w-full h-64 rounded-xl overflow-hidden border border-gray-200">
      <iframe
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY'}&q=${lat},${lng}&zoom=12`}
      />
      <div className="mt-2">
        <a
          href={googleMapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1"
        >
          在 Google Maps 中打开
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
}


