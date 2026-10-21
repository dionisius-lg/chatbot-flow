interface MediaIconProps {
    mediaId?: string | number;
    className?: string;
}

export default function MediaIcon({ mediaId, className = '' }: MediaIconProps) {
    const id = String(mediaId || '');

    switch (id) {
        case '4': // WhatsApp
            return (
                <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${className}`}
                    title='WhatsApp'
                >
                    <svg
                        viewBox='0 0 448 512'
                        className='w-4 h-4 sm:w-5 sm:h-5 fill-current'
                        aria-hidden='true'
                    >
                        <path d='M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z' />
                    </svg>
                </div>
            );

        case '5': // Facebook Message
            return (
                <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${className}`}
                    title='Facebook Message'
                >
                    <svg
                        viewBox='0 0 24 24'
                        className='w-4 h-4 sm:w-5 sm:h-5 fill-current'
                        aria-hidden='true'
                    >
                        <path d='M12 2C6.48 2 2 6.03 2 11c0 2.83 1.46 5.37 3.74 6.97V22l3.87-2.13c.77.21 1.57.33 2.39.33 5.52 0 10-4.03 10-9s-4.48-9-10-9zm1.09 12.16-2.58-2.75-5.04 2.75 5.54-5.88 2.65 2.75 4.97-2.75-5.54 5.88z' />
                    </svg>
                </div>
            );

        case '13': // Instagram Message
            return (
                <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 bg-pink-50 text-pink-600 border border-pink-100 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${className}`}
                    title='Instagram Message'
                >
                    <svg
                        viewBox='0 0 24 24'
                        className='w-4 h-4 sm:w-5 sm:h-5 fill-current'
                        aria-hidden='true'
                    >
                        <path d='M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' />
                    </svg>
                </div>
            );

        case '18': // Live Chat
            return (
                <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${className}`}
                    title='Live Chat'
                >
                    <svg
                        viewBox='0 0 24 24'
                        className='w-4 h-4 sm:w-5 sm:h-5 fill-none stroke-current stroke-2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        aria-hidden='true'
                    >
                        <path d='M7.9 20A9 9 0 1 0 4 16.1L2 22Z' />
                        <path d='M8 12h.01' />
                        <path d='M12 12h.01' />
                        <path d='M16 12h.01' />
                    </svg>
                </div>
            );

        default:
            return (
                <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 bg-gray-50 text-gray-500 border border-gray-200 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${className}`}
                    title={`Media #${id}`}
                >
                    <svg
                        viewBox='0 0 24 24'
                        className='w-4 h-4 sm:w-5 sm:h-5 fill-none stroke-current stroke-2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        aria-hidden='true'
                    >
                        <path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' />
                    </svg>
                </div>
            );
    }
}
