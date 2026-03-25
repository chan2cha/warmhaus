# API Spec

이 문서는 현재 코드에 구현된 API를 기준으로 정리한 명세 문서입니다.

주의:

- OpenAPI 형식이 아니라 실무용 개요 문서입니다.
- 응답 예시는 축약 형태입니다.
- 인증/권한은 현재 구현 기준으로 작성했습니다.

## 1. Client APIs

### `POST /api/client/leads`

고객 상담/견적 폼 제출 API입니다.

#### Purpose

- 리드 생성
- 기본 appointment 생성
- appointment candidate 생성

#### Request body 주요 필드

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `name` | string | 고객명 |
| `phone` | string | 연락처 |
| `channel` | string | 유입 경로 |
| `budget_range` | string | 예산 구간 값 |
| `budget_raw` | string | 표시용 예산 문자열 |
| `start_date` | string | 공사 시작 희망일 |
| `move_in_date` | string | 입주 예정일 |
| `zip_code` | string | 우편번호 |
| `address_road` | string | 도로명 주소 |
| `address_jibun` | string | 지번 주소 |
| `address_detail` | string | 상세 주소 |
| `address_full` | string | 전체 주소 |
| `area_pyeong` | string | 면적 |
| `type` | string | 공사/상담 유형 |
| `consult_confirm` | string | `phone` 또는 `office` |
| `preferred_slots` | string[] | 고객 희망 시간 배열 |
| `spec` | object | 공사 요청 상세 |
| `hp` | string | honeypot 필드 |

#### Response

```json
{
  "ok": true,
  "lead_id": "uuid"
}
```

#### Side Effects

1. `leads` insert
2. `appointments` insert
3. `appointment_candidates` bulk insert

---

### `GET /api/client/notice`

고객 폼 상단 공지 조회 API입니다.

#### Purpose

- `public_notice` 조회
- `lead_rules`를 조합해 region/open info 보강

#### Response

```json
{
  "notice": {
    "title": "상담 전 확인해주세요",
    "phone": "01012345678",
    "regionText": "시공 가능 지역 ...",
    "openInfo": ["[2026-03] 마감"],
    "extra": ["추가 안내 문구"]
  }
}
```

---

### `GET /api/client/rules`

운영 Rule 조회 API입니다.

#### Response

```json
{
  "rules": {
    "allowedRegions": [],
    "closedMonths": [],
    "partialOpen": [],
    "preferredBudgetManwon": 0,
    "minBudgetManwon": 0
  },
  "updated_at": "..."
}
```

---

### `GET /api/client/unavailable-slots?date=YYYY-MM-DD&consultType=phone|office`

특정 날짜에 예약 불가한 시간대를 조회합니다.

#### Purpose

- 이미 `CONFIRMED`된 일정과 겹치는 슬롯을 차단

#### Response

```json
{
  "items": [
    {
      "start_at": "2026-03-25T06:00:00.000Z"
    }
  ]
}
```

---

## 2. Lead APIs

### `GET /api/leads`

관리자 인박스용 리드 목록 조회 API입니다.

#### Response

```json
{
  "leads": []
}
```

---

### `GET /api/leads/[id]`

리드 상세 조회 API입니다.

#### Response

```json
{
  "lead": {}
}
```

---

### `PATCH /api/leads/[id]`

리드 상태 또는 다음 액션 일정을 수정합니다.

#### Request body

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `status` | string | 리드 상태 |
| `next_action_at` | string \| null | 다음 액션 시각 |

#### Response

```json
{
  "lead": {}
}
```

---

## 3. Appointment APIs

### `GET /api/leads/[id]/appointments`

리드의 현재 appointment와 candidate 목록을 조회합니다.

#### Response

```json
{
  "appointment": {},
  "candidates": []
}
```

---

### `POST /api/leads/[id]/appointments/confirm`

고객이 가능하다고 응답한 후보를 최종 확정합니다.

#### Request body

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `candidate_id` | string | 확정할 후보 ID |
| `memo` | string nullable | 메모 |

#### Side Effects

1. `appointments.status = CONFIRMED`
2. 선택 후보 `CONFIRMED`
3. 나머지 후보 `CANCELED`
4. `leads.status = APPOINTMENT_CONFIRMED`

#### Response

```json
{
  "appointment": {},
  "candidates": []
}
```

---

### `POST /api/leads/[id]/appointments/cancel`

확정된 상담 일정을 취소합니다.

#### Request body

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `appointment_id` | string | 일정 ID |
| `reason` | string nullable | 취소 사유 |

#### Side Effects

1. `appointments.status = CANCELED`
2. `leads.status = APPOINTMENT_CANCELLED`
3. 일부 candidate를 `PROPOSED`로 복구

---

### `POST /api/leads/[id]/appointments/reschedule`

확정 일정의 변경 요청을 처리합니다.

#### Request body

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `appointment_id` | string | 일정 ID |
| `reason` | string nullable | 변경 요청 사유 |

#### Side Effects

1. `appointments.status = RESCHEDULE_REQUESTED`
2. `leads.status = APPOINTMENT_RESCHEDULE`
3. 확정된 후보를 `CUSTOMER_DECLINED` 처리
4. 취소된 다른 후보 일부를 `PROPOSED`로 복구

---

## 4. Appointment Candidate APIs

### `POST /api/appointment-candidates/[id]/pending`

후보 시간을 고객 응답 대기 상태로 전환합니다.

#### Side Effects

1. `appointment_candidates.status = PENDING`
2. `leads.status = APPOINTMENT_PENDING`
3. 다른 active 후보가 있으면 실패

#### Response

```json
{
  "ok": true,
  "candidates": []
}
```

---

### `POST /api/appointment-candidates/[id]/reply`

고객 응답을 반영합니다.

#### Request body

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `replyType` | `"CONFIRMED"` \| `"DECLINED"` | 고객 응답 |
| `replyText` | string nullable | 응답 메모 |

#### Side Effects

1. `PENDING -> CUSTOMER_CONFIRMED` 또는 `CUSTOMER_DECLINED`
2. `leads.status = APPOINTMENT_PENDING`

#### Response

```json
{
  "ok": true,
  "candidates": []
}
```

---

## 5. Admin APIs

### `PATCH /api/admin/notice`

공지사항 저장 API입니다.

#### Auth

- `x-admin-email` 헤더 기반 allowlist 체크

#### Request body

```json
{
  "notice": {
    "title": "상담 전 확인해주세요",
    "phone": "01012345678",
    "extra": ["문구 1", "문구 2"]
  }
}
```

---

### `PATCH /api/admin/rules`

운영 Rule 저장 API입니다.

#### Auth

- 현재 코드 기준 관리자 검증이 주석 처리되어 있음

#### Request body

```json
{
  "rules": {
    "allowedRegions": ["서울", "경기 성남"],
    "closedMonths": ["2026-03"],
    "partialOpen": ["2026-04-22"],
    "preferredBudgetManwon": 5000,
    "minBudgetManwon": 3000
  }
}
```

---

## 6. Webhook API

### `POST /api/webhook/google-form`

Google Form 유입 리드를 적재하는 webhook입니다.

#### Auth

- `x-webhook-secret` 헤더 검증

#### Purpose

- 외부 폼에서 들어오는 리드를 `leads`에 저장

#### Note

- 고객 공개 폼 경로보다 적은 필드만 저장합니다.

---

## 7. Known API Issues

### 1. Rule key 혼용

- 조회는 `lead_rules`
- 일부 리드 등급 계산 로직은 `rules`

정합성 정리가 필요합니다.

### 2. 관리자 인증 일관성 부족

- notice API는 헤더 검증
- rules API는 검증 코드가 주석 처리

### 3. 에러 구조 표준화 부족

- 대부분 `{ error: string }` 형태이지만 응답 형식이 완전히 표준화돼 있지는 않습니다.
