# System Overview

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript |
| UI | MUI 7, Emotion |
| Form Validation | React Hook Form, Zod |
| Backend | Next.js Route Handlers |
| Data | Supabase |
| Utilities | Day.js |

## App Areas

### Public

- `/client`
- `/client/form`

### Dashboard

- `/`
- `/leads/[id]`
- `/admin/notice`
- `/admin/rules`

## Main Data Entities

### `leads`

리드의 중심 엔티티입니다.

- 고객 이름 / 연락처
- 주소
- 예산 범위
- 상담 방식
- 리드 상태
- 등급
- 공사 요청 상세 `spec`

### `appointments`

리드 단위 상담 일정의 현재 상태를 담습니다.

- `NEGOTIATING`
- `CONFIRMED`
- `CANCELED`
- `DONE`
- `NO_SHOW`
- `RESCHEDULE_REQUESTED`

### `appointment_candidates`

고객이 입력한 희망 시간 또는 운영자가 제안한 시간을 담습니다.

- 시작/종료 시간
- 우선순위
- 후보 상태
- 응답 시각

### `settings`

서비스 전역 설정입니다.

- `public_notice`
- `lead_rules`

## API Groups

### Client APIs

- 고객 폼 제출
- 고객 공지 조회
- Rule 조회
- 날짜별 예약 불가 시간 조회

### Lead APIs

- 리드 목록 조회
- 리드 상세 조회/수정
- 일정 조회
- 일정 확정/취소/변경 요청

### Candidate APIs

- 후보를 대기 상태로 전환
- 고객 응답 반영

### Admin APIs

- 공지 저장
- Rule 저장

## Important Notes

- `supabaseAdmin.ts`는 service role key 기반입니다.
- `ssr.ts`는 서버 사이드 클라이언트 생성을 담당합니다.
- 관리자 인증은 일부 엔드포인트에서만 제한적으로 적용되어 있습니다.
- 고객 첨부 파일은 현재 실제 업로드 스토리지와 연결되어 있지 않습니다.
