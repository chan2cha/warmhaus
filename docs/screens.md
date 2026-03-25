# Screens

이 문서는 현재 서비스의 주요 화면을 목적, 주요 데이터, 핵심 액션 기준으로 정리한 화면 정의서입니다.

## 1. 고객 소개 페이지

### Route

- `/client`

### Purpose

- 브랜드 첫 인상 제공
- 외부 채널 링크 제공
- 문의 폼 진입 유도

### Main Content

- 브랜드명
- 전화번호
- 주소
- 홈페이지 링크
- 블로그 링크
- 인스타그램 링크
- 문의 폼 이동 버튼

### Primary Actions

- 홈페이지 이동
- 블로그 이동
- 인스타그램 이동
- 상담/견적 문의 폼 이동

---

## 2. 고객 상담/견적 폼

### Route

- `/client/form`

### Purpose

- 상담 리드 수집
- 공사 범위와 예산 정보 선제 확보
- 상담 희망 시간 수집

### Main Sections

1. 기본 정보
2. 확장/구조
3. 창호/문선
4. 바닥/몰딩/중문/필름
5. 욕실/타일/벽체 마감
6. 전기/탄성코트/에어컨
7. 가구/도면/기타

### Main Data

- 이름, 연락처
- 주소
- 면적
- 예산
- 공사 항목별 체크 정보
- 상담 방식
- 희망 시간 후보

### Primary Actions

- 단계별 다음/이전
- 주소 검색
- 파일 선택
- 희망 시간 선택
- 최종 제출

### Related API

- `GET /api/client/notice`
- `GET /api/client/unavailable-slots`
- `POST /api/client/leads`

---

## 3. 관리자 인박스

### Route

- `/`

### Purpose

- 신규/진행 중 리드 빠른 확인
- 일정 기준 분류
- 상세 화면 진입

### Main Content

- 리드 카드 목록
- 탭 필터
  - 오늘
  - 내일
  - 이번 주
  - 미예약
- 주간 요약 영역

### Card Data

- 고객명
- 연락처
- 예산
- 유형/면적
- 주소
- 예약 시간 또는 미예약 표시

### Primary Actions

- 리드 상세 이동
- 전화 걸기
- 새로고침
- 캘린더 이동 링크

### Related API

- `GET /api/leads`

---

## 4. 리드 상세

### Route

- `/leads/[id]`

### Purpose

- 리드 기본 정보 확인
- 상담 후보 시간 협의
- 문자 템플릿 생성
- 일정 확정/취소/변경 요청 처리

### Main Areas

#### 기본 정보 카드

- 등급
- 고객명
- 상태
- 연락처
- 유형
- 면적
- 예산
- 시작/입주일
- 유입 채널
- 주소

#### 일정 협의 패널

- 현재 appointment 상태
- 후보 시간 목록
- 후보별 상태
- 문자 템플릿 다이얼로그
- 일정 취소/변경 요청 다이얼로그

### Primary Actions

- 전화 걸기
- 후보 문자 템플릿 열기
- 후보를 대기 상태로 변경
- 고객 응답 반영
- 일정 확정
- 일정 취소
- 일정 변경 요청

### Related API

- `GET /api/leads/[id]`
- `PATCH /api/leads/[id]`
- `GET /api/leads/[id]/appointments`
- `POST /api/appointment-candidates/[id]/pending`
- `POST /api/appointment-candidates/[id]/reply`
- `POST /api/leads/[id]/appointments/confirm`
- `POST /api/leads/[id]/appointments/cancel`
- `POST /api/leads/[id]/appointments/reschedule`

---

## 5. 공지사항 관리

### Route

- `/admin/notice`

### Purpose

- 고객 폼 상단 공지 문구 관리

### Main Content

- 제목
- 전화번호
- 추가 안내 문구
- 공지 미리보기
- Rule 미리보기 링크

### Primary Actions

- 공지 수정
- 미리보기
- 저장
- Rule 화면 이동

### Related API

- `GET /api/client/notice`
- `GET /api/client/rules`
- `PATCH /api/admin/notice`

---

## 6. Rule 관리

### Route

- `/admin/rules`

### Purpose

- 접수 정책을 운영자가 직접 수정

### Main Content

- 허용 지역 목록
- 마감 월 목록
- 부분 가능 날짜 목록
- 최소 예산
- 선호 예산

### Primary Actions

- 지역 추가/삭제
- 마감 월 추가/삭제
- 부분 가능 날짜 추가/삭제
- 예산 기준 수정
- 저장
- 새로고침

### Related API

- `GET /api/client/rules`
- `PATCH /api/admin/rules`

---

## 7. 미구현/예정 화면

### 캘린더 화면

현재 UI에는 `/admin/calendar` 이동 링크가 존재하지만 실제 페이지는 구현되어 있지 않습니다.

예정 목적:

- 전체 상담 일정 월/주간 뷰 제공
- 충돌 확인
- 일정 재배치

---

## Recommended Screenshot Mapping

실제 캡처 이미지를 저장할 때 아래 이름으로 맞추면 README와 문서를 연결하기 쉽습니다.

| 파일명 | 대상 화면 |
| --- | --- |
| `client-home.png` | 고객 소개 페이지 |
| `client-form-stepper.png` | 고객 문의 폼 |
| `admin-inbox.png` | 관리자 인박스 |
| `lead-detail.png` | 리드 상세 |
| `admin-notice.png` | 공지사항 관리 |
| `admin-rules.png` | Rule 관리 |
