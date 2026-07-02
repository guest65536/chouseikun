# 調整くん — 設計ドキュメント

日程調整ツール（「調整さん」的なイベント作成→出欠回答→集計→SNSシェア）。
ログイン不要。管理は秘密トークンURL方式。

## 技術スタック / インフラ
- **フレームワーク**: Next.js (App Router) + TypeScript + Tailwind CSS
- **ORM / DB**: Prisma + Neon (Postgres)
- **デプロイ**: Vercel（GitHub連携で main push → 自動デプロイ）
- **リアルタイム集計**: 画面リロード / 定期ポーリング（WebSocket等の外部サービスは不使用）
- **認証**: 無し。イベント編集/削除は `adminToken`、参加者の回答編集は `editToken`（どちらも推測困難なランダム文字列をURLに載せる）

---

## 1. データベース設計（Prisma）

イベント全体の管理トークン(`adminToken`)と、参加者が自分の回答を後で編集するための参加者トークン(`editToken`)の2種類を持つ。出欠は ○△× の3択、コメントは回答者ごとに1つ。

```prisma
// prisma/schema.prisma
generator client { provider = "prisma-client-js" }

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")          // Neon pooled (pgbouncer)
  directUrl = env("DATABASE_URL_UNPOOLED") // migrate用の直接接続
}

enum ResponseStatus { OK MAYBE NG } // ○ △ ×

model Event {
  id          String    @id @default(cuid())
  title       String
  description String?   @db.Text
  adminToken  String    @unique @default(cuid()) // 管理用秘密トークン
  deadline    DateTime? // 回答期限（任意）
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  candidates   EventDate[]
  participants Participant[]
  @@index([adminToken])
}

model EventDate {
  id        String    @id @default(cuid())
  eventId   String
  label     String    // "7/10(金) 19:00〜" など自由入力
  startAt   DateTime? // ソート/当日判定用（任意）
  sortOrder Int       @default(0)

  event     Event      @relation(fields: [eventId], references: [id], onDelete: Cascade)
  responses Response[]
  @@index([eventId])
}

model Participant {
  id        String   @id @default(cuid())
  eventId   String
  name      String
  comment   String?  @db.Text
  editToken String   @unique @default(cuid()) // 本人の回答編集用
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  event     Event      @relation(fields: [eventId], references: [id], onDelete: Cascade)
  responses Response[]
  @@index([eventId])
}

model Response {
  id            String         @id @default(cuid())
  participantId String
  eventDateId   String
  status        ResponseStatus

  participant Participant @relation(fields: [participantId], references: [id], onDelete: Cascade)
  eventDate   EventDate   @relation(fields: [eventDateId], references: [id], onDelete: Cascade)

  @@unique([participantId, eventDateId]) // 1人1候補日につき1回答
  @@index([eventDateId])
}
```

ポイント: トークンは `cuid()` で自動生成 / `onDelete: Cascade` でイベント削除時に子レコードも連動削除 / コメントは回答全体に1つ（候補日ごとのコメントはMVP対象外）。

---

## 2. 画面構成（ルーティング）

| パス | 役割 |
|---|---|
| `/` | トップ（サービス説明 + 「イベントを作成する」CTA） |
| `/events/new` | イベント作成フォーム（候補日を動的に追加/削除） |
| `/events/[eventId]/created` | 作成完了。回答用URL・管理用URLを発行、SNSシェア導線 |
| `/e/[eventId]` | **メイン**: 公開の回答フォーム + 集計結果テーブルを同居表示 |
| `/e/[eventId]/edit/[editToken]` | 参加者が自分の回答を編集（P1） |
| `/admin/[eventId]/[adminToken]` | 管理画面（タイトル/候補日の編集、イベント削除） |

集計結果は別ルートに分けず `/e/[eventId]` に同居（調整さんと同じ、回答直後に結果が見えるUX）。

---

## 3. 機能一覧（優先度付き）

**P0（MVP必須）**
1. イベント作成（タイトル・候補日程 複数・説明・回答期限任意）
2. 作成完了画面での回答URL/管理URL表示＋コピー/シェア
3. 出欠回答（名前 + 候補日ごとに○△× + 全体コメント任意）
4. 集計結果表示（回答後に再取得、他者の回答は手動リロード or ポーリング）
5. SNSシェア（X Intent / LINE / URLコピー / Web Share API）
6. 入力バリデーション（サーバー側必須、Zod）
7. 管理画面での編集・削除

**P1（後回し可）**
8. 参加者本人の回答編集（editToken方式）
9. 回答期限超過で新規回答ブロック
10. 簡易スパム対策（honeypot + レート制限）
11. 集計表の見やすさ（○△×人数の色分け、最有力候補ハイライト）

**P2（任意）**
12. ポーリング自動更新（30秒毎など）
13. 候補日の一括貼り付けパース
14. ダークモード等 → 今回はスコープ外

---

## 4. API設計

**方針**: 作成/更新/削除は **Server Actions** を基本。Route Handler は集計の再取得（ポーリング用）に限定。両者で `lib/` 内の共通関数を呼び重複を避ける。

Server Actions 配置:
- `app/events/new/actions.ts` — `createEvent`
- `app/e/[eventId]/actions.ts` — `submitResponse`, `getSummary`
- `app/e/[eventId]/edit/[editToken]/actions.ts` — `updateResponse`, `deleteResponse`（P1）
- `app/admin/[eventId]/[adminToken]/actions.ts` — `updateEvent`, `deleteEvent`, `addCandidateDate`, `removeCandidateDate`

Route Handler（ポーリングする場合のみ）:
- `GET /api/events/[eventId]/summary` — 候補日ごとの○△×集計 + 参加者一覧をJSONで返す

トークン検証は `lib/auth-token.ts` に集約し、不一致なら `notFound()`。

---

## 5. ディレクトリ構成

```
調整くん/
├── prisma/schema.prisma
├── app/
│   ├── layout.tsx / globals.css / page.tsx
│   ├── events/new/{page.tsx, actions.ts}
│   ├── events/[eventId]/created/page.tsx
│   ├── e/[eventId]/{page.tsx, actions.ts}
│   ├── e/[eventId]/edit/[editToken]/{page.tsx, actions.ts}   # P1
│   ├── admin/[eventId]/[adminToken]/{page.tsx, actions.ts}
│   └── api/events/[eventId]/summary/route.ts                 # ポーリング用（任意）
├── components/
│   ├── EventForm.tsx / CandidateDateInput.tsx
│   ├── ResponseForm.tsx / SummaryTable.tsx
│   ├── ShareButtons.tsx / CopyUrlButton.tsx
│   └── ui/  (Button, Input, Card, Badge, Table — shadcn/ui想定)
├── lib/
│   ├── prisma.ts        # PrismaClientシングルトン（HMR多重生成対策）
│   ├── auth-token.ts    # adminToken/editToken検証
│   ├── validation.ts    # Zodスキーマ
│   └── date.ts          # 候補日ラベルのフォーマット/ソート
├── .env.example
└── README.md
```

---

## 6. Vercel + Neon + GitHub セットアップ

**Neon**: プロジェクト作成 → 接続文字列を2種取得
- Pooled（ホスト名に `-pooler`）→ `DATABASE_URL`
- Direct（`-pooler` 無し）→ `DATABASE_URL_UNPOOLED`（migrate用）
- どちらも `?sslmode=require` を確認

**package.json スクリプト**（push毎に確実にClient再生成＆migrate適用）:
```json
"scripts": {
  "dev": "next dev",
  "build": "prisma generate && prisma migrate deploy && next build",
  "postinstall": "prisma generate",
  "start": "next start"
}
```
- `prisma` は `dependencies` に置く（Vercelビルド時のprune回避）
- 本番は `prisma migrate deploy`（既存マイグレーション適用のみ）、ローカルは `prisma migrate dev`

**Vercel**: Project Settings → Environment Variables に `DATABASE_URL` / `DATABASE_URL_UNPOOLED` を設定 → GitHubリポジトリをインポート → main push で自動デプロイ。

**注意**: Neon pooler で `prepared statement already exists` が出たら接続文字列に `pgbouncer=true&connection_limit=1` を追加。MVPは本番DB 1つで運用（Preview環境も同DBを向く点に注意）。

---

## 7. 実装順序

1. `create-next-app`（TS / App Router / Tailwind）
2. Prisma導入 → `schema.prisma` 記述
3. Neon作成 → `.env` 設定 → `prisma migrate dev --name init` → `prisma studio` で確認
4. `lib/prisma.ts` シングルトン
5. `lib/validation.ts`（Zodスキーマ）
6. イベント作成（`events/new` + `EventForm` + `createEvent` → `created` へredirect）
7. 作成完了画面（`CopyUrlButton` / `ShareButtons`）
8. 回答画面本体（`/e/[eventId]` + `ResponseForm` の○△×トグル + `SummaryTable`、`submitResponse` はトランザクション）
9. 管理画面（トークン検証 → 候補日追加/削除・削除）
10. P1: 参加者編集ページ
11. バリデーション/エッジケース（空欄、候補日0件、404、トークン改ざん）
12. モバイル優先のレスポンシブ仕上げ
13. GitHub push → Vercelデプロイ確認

---

## 8. 検証方法

```bash
npm install
npx prisma migrate dev   # Neon(直接接続)へ適用
npm run dev              # http://localhost:3000
```

手動E2E:
1. イベント作成（タイトル + 候補日3件）
2. 作成完了画面の回答URLをシークレットウィンドウで開く（別参加者を模擬）
3. 「山田」で○△×＋コメント送信 → 通常ウィンドウをリロードして反映確認
4. 別シークレットで「鈴木」回答 → 集計が合算されるか
5. X/LINE/コピー/Web Share 各ボタンの動作確認（Web Shareはモバイルエミュレーション）
6. 管理URLで候補日削除 → 回答画面に反映確認
7. 管理URLでイベント削除 → 回答URLが404になるか
8. 改ざんしたトークンでアクセス → 404になるか
