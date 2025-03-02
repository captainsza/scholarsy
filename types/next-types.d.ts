import 'next';

declare module 'next' {
  // Extend Next.js PageProps to accept our params format
  interface PageProps {
    params?: {
      [key: string]: string;
    };
    searchParams?: {
      [key: string]: string | string[];
    };
  }
}
