import React from "react";

export default function ApplicationLogo({ className }) {
    return (
        <div className={className}>
            <div className="flex items-center">
                <div className="mr-2">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="40" height="40" rx="8" fill="#0057B8" />
                        {/* Cell Tower Design */}
                        <path d="M20 6L20 34" stroke="white" strokeWidth="2" strokeLinecap="round" />
                        <path d="M15 11C15 11 20 9 25 11" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M13 15C13 15 20 12 27 15" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M11 19C11 19 20 15 29 19" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                        {/* Signal Waves */}
                        <path d="M27 25C29.2091 25 31 23.2091 31 21C31 18.7909 29.2091 17 27 17" stroke="#00AEEF" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M27 29C31.4183 29 35 25.4183 35 21C35 16.5817 31.4183 13 27 13" stroke="#00AEEF" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M13 25C10.7909 25 9 23.2091 9 21C9 18.7909 10.7909 17 13 17" stroke="#00AEEF" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M13 29C8.58172 29 5 25.4183 5 21C5 16.5817 8.58172 13 13 13" stroke="#00AEEF" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                </div>
                <div className="text-gray-800 font-bold text-xl tracking-tight">
                    <span className="text-blue-600">FWPM</span>
                </div>
            </div>
        </div>
    );
}
