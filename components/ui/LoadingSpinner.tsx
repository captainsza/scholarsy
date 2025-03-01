interface LoadingSpinnerProps {
  message?: string;
  size?: "small" | "medium" | "large";
}

export default function LoadingSpinner({ message = "Loading...", size = "medium" }: LoadingSpinnerProps) {
  const sizeClasses = {
    small: "h-4 w-4 border-2",
    medium: "h-8 w-8 border-4",
    large: "h-12 w-12 border-4",
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] p-4">
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-t-transparent border-blue-600 mb-4`}></div>
      <p className="text-gray-600">{message}</p>
    </div>
  );
}
