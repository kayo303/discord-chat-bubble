import "./globals.css";

export const metadata = {
  title: "Discord 대화 말풍선 정리기",
  description: "디스코드 대화를 복사/붙여넣기하면 예쁜 Discord 스타일 말풍선 이미지로 내보낼 수 있어요.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-[#1E1F22] text-[#DBDEE1]">{children}</body>
    </html>
  );
}
