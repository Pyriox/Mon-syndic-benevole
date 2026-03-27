'use client';
// Wrapper client pour les composants PDF — next/dynamic avec ssr:false
// n'est autorisé que dans les composants client.
import dynamic from 'next/dynamic';

export const PVPDF = dynamic(() => import('./PVPDF'), { ssr: false });
export const ConvocationPDF = dynamic(() => import('./ConvocationPDF'), { ssr: false });
