'use client';

interface ShareButtonProps {
  title: string;
  description?: string;
  url?: string;
}

export default function ShareButton({ title, description, url }: ShareButtonProps) {
  const handleShare = () => {
    const shareUrl = url || window.location.href;
    
    if (navigator.share) {
      navigator.share({
        title,
        text: description,
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      // 可以添加一个toast提示
      alert('Link copied to clipboard!');
    }
  };

  return (
    <button
      onClick={handleShare}
      className="text-blue-600 hover:text-blue-500 font-medium"
    >
      Share
    </button>
  );
}