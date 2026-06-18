---
date: 2026-05-07
created_by: Warp Oz Agent
source: Oz by Warp
tags:
  - guidelines
  - ai
  - markdown
  - obsidian
---

# Oz との作業ガイドライン

本プロジェクトで Oz（Warp AI Agent）がファイルを生成・編集する際の共通ルールです。新規会話開始時は本ファイルを参照してください。

## 1. マークダウン出力時の必須フォーマット

- **YAML フロントマターをファイル冒頭に必須で付与**
- フロントマターには最低限以下を含める:
  - `date`: YYYY-MM-DD 形式
  - `created_by`: `Warp Oz Agent`
  - `source`: `Oz by Warp`
  - `tags`: コンテキストに応じたタグ配列

## 2. Obsidian タグ付けルール

`tags` には以下のカテゴリを含める（適用できるもののみ）:

| カテゴリ | 使用タグ例 |
|---|---|
| 問題・エラー | `troubleshooting`, `error`, `bug` |
| 技術領域 | `vercel`, `cli`, `nextjs`, `react`, `database`, `auth` |
| プラットフォーム | `macos`, `big-sur`, `vercel`, `upstash` |
| 作業種別 | `deployment`, `setup`, `refactor`, `testing` |

## 3. 作成者明記

フロントマターの `created_by` と `source` に AI 名を明記し、後から誰が作成したか追跡できるようにする。

## 4. ファイル末尾のメタデータ追加禁止

Obsidian のパースやバックリンクに影響を与えるため、ファイル末尾に `---` 区切りのメタデータセクションを追加しない。

## 5. このガイドラインの参照方法

新規会話では、まず本ファイルを読み込んでから作業を開始する:

```bash
cat docs/ai_guidelines.md
```

または、Oz に対して「`docs/ai_guidelines.md` を読んでください」と指示する。
