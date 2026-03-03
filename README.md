# Discord 대화 말풍선 정리기 (GitHub Pages)

디스코드 대화를 복사/붙여넣기하면 Discord 느낌의 예쁜 채팅 로그로 렌더링하고 PNG로 저장할 수 있는 웹사이트입니다.

## 1) 로컬에서 실행하기 (처음 1회)
1. Node.js 설치 (권장: LTS)
2. 이 폴더에서 터미널 열기
3. 아래 실행

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:3000 열면 됩니다.

## 2) GitHub Pages로 배포하기 (가장 쉬운 방법: GitHub Actions)

### (1) 새 레포 만들기
- GitHub에서 새 repo 생성 (예: `discord-chat-bubble`)
- 이 프로젝트 파일을 전부 업로드(커밋/푸시)

### (2) Pages 설정
- GitHub repo → Settings → Pages
- Source: **GitHub Actions** 선택

### (3) 배포 워크플로우 추가
이미 이 프로젝트에 `.github/workflows/deploy.yml`가 들어있습니다.
푸시하면 자동으로 빌드/배포됩니다.

### (4) basePath 설정 (중요)
GitHub Pages는 주소가 보통 이렇게 됩니다:
`https://<유저명>.github.io/<레포명>/`

그래서 `<레포명>`이 basePath가 되어야 합니다.

이 프로젝트는 `NEXT_PUBLIC_BASE_PATH` 환경변수로 basePath를 설정합니다.
워크플로우에서 레포명으로 자동 설정하도록 되어있습니다.

## 3) 지원 입력 포맷
```
작성자 — 2026-02-20 오전 12:39
메시지 내용...
```

## 4) 팁
- 대화가 너무 길면 PNG 저장이 실패할 수 있어요. 여러 번 나눠 저장해 주세요.
