'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

// ── 타입 ──────────────────────────────────────────────────────
type ProductRow = {
  id?: string
  product_name: string
  item_code: string
  brand: string
  price: number | string
  main_image: string
  sub_images: string[]
  html: string
  created_at?: string
}

type EditableProduct = {
  id?: string
  product_name: string
  item_code: string
  brand: string
  price: string
  main_image: string
  sub_images_text: string
  html: string
}

type ApprovalRow = {
  id: string
  user_id: string
  email: string
  approved: boolean
  created_at: string
}

type Tab = 'products' | 'approvals'

// ── 상수 ──────────────────────────────────────────────────────
const BRAND_OPTIONS = ['MINIMUM', 'HARUE', 'TRENDON']
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'haruetech@gmail.com'

const MENU_ITEMS = [
  { name: '상품관리', desc: '등록 상품 조회 / 수정', tab: 'products' as Tab },
  { name: '승인관리', desc: '가입 신청 승인 / 취소', tab: 'approvals' as Tab },
  { name: '상세페이지 제작', desc: '품번 생성 + HTML 제작', route: '/detail' },
  { name: '등록데이터 관리', desc: '업로드 전 데이터 정리' },
  { name: '사방넷 등록', desc: '엑셀 다운로드 / 업로드' },
  { name: '카페24 등록', desc: '카페24 상품 등록' },
  { name: '주문관리', desc: '주문 수집 / 처리' },
  { name: '업체관리', desc: '공급사 / 거래처 관리' },
  { name: 'CS관리', desc: '고객 응대 / 문의 관리' },
]

// ── Supabase ──────────────────────────────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null

// ── 헬퍼 ──────────────────────────────────────────────────────
function normalizeProduct(row: any): ProductRow {
  return {
    id: row?.id ?? '',
    product_name: row?.product_name ?? '',
    item_code: row?.item_code ?? '',
    brand: row?.brand ?? '',
    price: row?.price ?? '',
    main_image: row?.main_image ?? '',
    sub_images: Array.isArray(row?.sub_images)
      ? row.sub_images.filter(Boolean)
      : typeof row?.sub_images === 'string'
        ? row.sub_images.split('\n').map((v: string) => v.trim()).filter(Boolean)
        : [],
    html: row?.html ?? '',
    created_at: row?.created_at ?? '',
  }
}

function toEditable(product: ProductRow | null): EditableProduct {
  return {
    id: product?.id ?? '',
    product_name: product?.product_name ?? '',
    item_code: product?.item_code ?? '',
    brand: product?.brand ?? 'MINIMUM',
    price: String(product?.price ?? ''),
    main_image: product?.main_image ?? '',
    sub_images_text: (product?.sub_images ?? []).join('\n'),
    html: product?.html ?? '',
  }
}

function emptyEditable(): EditableProduct {
  return { id: '', product_name: '', item_code: '', brand: 'MINIMUM', price: '', main_image: '', sub_images_text: '', html: '' }
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;')
}

function buildAutoHtml(form: EditableProduct) {
  const subImages = form.sub_images_text.split('\n').map((v) => v.trim()).filter(Boolean)
  const gallery = subImages.length
    ? subImages.map((img) => `<div style="margin-bottom:12px;"><img src="${img}" alt="detail" style="display:block;width:100%;max-width:1100px;margin:0 auto;border:0;" /></div>`).join('')
    : ''
  return `
<div style="max-width:1100px;margin:0 auto;background:#ffffff;color:#111111;font-family:Arial,'Apple SD Gothic Neo','Noto Sans KR',sans-serif;">
  <div style="padding:24px 20px 14px 20px;border-bottom:1px solid #e5e5e5;">
    <div style="font-size:13px;color:#666666;">${escapeHtml(form.brand || '-')}</div>
    <div style="margin-top:8px;font-size:30px;font-weight:700;">${escapeHtml(form.product_name || '상품명')}</div>
    <div style="margin-top:10px;font-size:14px;color:#777777;">품번 : ${escapeHtml(form.item_code || '-')}</div>
    <div style="margin-top:6px;font-size:18px;font-weight:700;">${escapeHtml(form.price || '0')}원</div>
  </div>
  ${form.main_image ? `<div style="padding:24px 20px 10px;"><img src="${form.main_image}" alt="main" style="display:block;width:100%;max-width:1100px;margin:0 auto;border:0;" /></div>` : ''}
  ${gallery ? `<div style="padding:10px 20px 24px;">${gallery}</div>` : ''}
  <div style="padding:28px 20px;border-top:1px solid #f0f0f0;">
    <div style="font-size:22px;font-weight:700;margin-bottom:16px;">상품 정보</div>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tbody>
        <tr><td style="width:180px;padding:12px;border:1px solid #eaeaea;background:#fafafa;font-weight:600;">브랜드</td><td style="padding:12px;border:1px solid #eaeaea;">${escapeHtml(form.brand || '-')}</td></tr>
        <tr><td style="padding:12px;border:1px solid #eaeaea;background:#fafafa;font-weight:600;">상품명</td><td style="padding:12px;border:1px solid #eaeaea;">${escapeHtml(form.product_name || '-')}</td></tr>
        <tr><td style="padding:12px;border:1px solid #eaeaea;background:#fafafa;font-weight:600;">품번</td><td style="padding:12px;border:1px solid #eaeaea;">${escapeHtml(form.item_code || '-')}</td></tr>
        <tr><td style="padding:12px;border:1px solid #eaeaea;background:#fafafa;font-weight:600;">판매가</td><td style="padding:12px;border:1px solid #eaeaea;">${escapeHtml(form.price || '0')}원</td></tr>
      </tbody>
    </table>
  </div>
  <div style="padding:28px 20px 40px;"><div style="font-size:12px;color:#999999;line-height:1.8;text-align:center;">모니터 해상도 및 촬영 환경에 따라 실제 색상과 차이가 있을 수 있습니다.<br/>측정 방법에 따라 오차가 있을 수 있습니다.</div></div>
</div>`.trim()
}

// ── CharacterBadge ──────────────────────────────────────────
function CharacterBadge() {
  const [failed, setFailed] = useState(false)
  const [preview, setPreview] = useState('/character.png')

  if (failed) {
    return (
      <label className="group flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border border-neutral-200 bg-gradient-to-br from-neutral-900 to-neutral-700 text-sm font-bold text-white shadow-sm transition hover:scale-[1.03]">
        H
        <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setPreview(URL.createObjectURL(f)); setFailed(false) } }} />
      </label>
    )
  }
  return (
    <label className="group relative block h-14 w-14 cursor-pointer overflow-hidden rounded-full border border-neutral-200 bg-white shadow-sm transition hover:scale-[1.03]">
      <img src={preview} alt="하루애 캐릭터" className="h-full w-full object-cover" onError={() => setFailed(true)} />
      <div className="absolute inset-0 flex items-center justify-center bg-black/0 text-[10px] font-semibold text-white opacity-0 transition group-hover:bg-black/35 group-hover:opacity-100">변경</div>
      <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setPreview(URL.createObjectURL(f)) }} />
    </label>
  )
}

// ── 로그인 화면 ───────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!supabase) { setError('Supabase 설정이 없습니다.'); return }
    if (!email || !password) { setError('이메일과 비밀번호를 입력해주세요.'); return }
    setLoading(true); setError('')
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err || !data.user) { setError('이메일 또는 비밀번호가 올바르지 않습니다.'); return }
    if (data.user.email !== ADMIN_EMAIL) {
      await supabase.auth.signOut()
      setError('관리자 계정이 아닙니다.')
      return
    }
    onLogin()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-100 px-4">
      <div className="w-full max-w-sm rounded-[28px] border border-neutral-200 bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.1)]">
        <div className="mb-8 text-center">
          <div className="mb-1 text-2xl font-bold tracking-widest text-neutral-900">HARU'E PICK</div>
          <div className="text-xs tracking-widest text-amber-500">관리자 운영페이지</div>
          <div className="mx-auto mt-4 h-px w-10 bg-amber-400" />
        </div>
        <div className="space-y-3">
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일" onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none focus:border-neutral-400 focus:bg-white"
          />
          <input
            type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호" onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none focus:border-neutral-400 focus:bg-white"
          />
          {error && <div className="rounded-xl bg-red-50 px-4 py-2 text-xs text-red-500">{error}</div>}
          <button
            type="button" onClick={handleLogin} disabled={loading}
            className="w-full rounded-2xl bg-neutral-900 py-3 text-sm font-bold text-white transition hover:bg-neutral-700 disabled:opacity-60"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 승인관리 패널 ─────────────────────────────────────────────
function ApprovalsPanel() {
  const [approvals, setApprovals] = useState<ApprovalRow[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    if (!supabase) return
    setLoading(true)
    const { data, error } = await supabase.from('user_approvals').select('*').order('created_at', { ascending: false })
    setLoading(false)
    if (error) { setMessage('불러오기 오류: ' + error.message); return }
    setApprovals(data ?? [])
  }, [])

  useEffect(() => { load() }, [load])

  async function toggle(row: ApprovalRow) {
    if (!supabase) return
    const { error } = await supabase.from('user_approvals').update({ approved: !row.approved }).eq('user_id', row.user_id)
    if (error) { setMessage('오류: ' + error.message); return }
    setMessage((!row.approved ? '승인' : '승인 취소') + ' 처리되었습니다.')
    await load()
  }

  const pending = approvals.filter((a) => !a.approved)
  const approved = approvals.filter((a) => a.approved)

  return (
    <div className="space-y-4">
      {message && (
        <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 shadow-sm">
          {message}
        </div>
      )}
      <div className="rounded-[24px] border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-base font-semibold text-neutral-900">승인 대기</div>
            <div className="text-xs text-neutral-500">{pending.length}명 대기 중</div>
          </div>
          <button type="button" onClick={load} className="rounded-xl border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50">새로고침</button>
        </div>
        {loading ? (
          <div className="py-10 text-center text-sm text-neutral-400">불러오는 중...</div>
        ) : pending.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 py-10 text-center text-sm text-neutral-400">대기중인 신청자가 없습니다.</div>
        ) : (
          <div className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200">
            {pending.map((row) => (
              <div key={row.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1">
                  <div className="text-sm font-medium text-neutral-900">{row.email}</div>
                  <div className="text-xs text-neutral-400">{new Date(row.created_at).toLocaleDateString('ko-KR')} 가입</div>
                </div>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600">대기중</span>
                <button type="button" onClick={() => toggle(row)} className="rounded-xl bg-neutral-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-neutral-700">승인</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-[24px] border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <div className="text-base font-semibold text-neutral-900">승인된 사용자</div>
          <div className="text-xs text-neutral-500">{approved.length}명</div>
        </div>
        {approved.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 py-10 text-center text-sm text-neutral-400">승인된 사용자가 없습니다.</div>
        ) : (
          <div className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200">
            {approved.map((row) => (
              <div key={row.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1">
                  <div className="text-sm font-medium text-neutral-900">{row.email}</div>
                  <div className="text-xs text-neutral-400">{new Date(row.created_at).toLocaleDateString('ko-KR')} 가입</div>
                </div>
                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-600">승인됨</span>
                <button type="button" onClick={() => toggle(row)} className="rounded-xl border border-neutral-200 px-4 py-2 text-xs font-medium text-neutral-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500">취소</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── 메인 페이지 ───────────────────────────────────────────────
export default function Page() {
  const router = useRouter()

  // 로그인 상태
  const [authed, setAuthed] = useState<boolean | null>(null)

  // 탭
  const [activeTab, setActiveTab] = useState<Tab>('products')

  // 상품관리
  const [products, setProducts] = useState<ProductRow[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [editMode, setEditMode] = useState(false)
  const [isNewMode, setIsNewMode] = useState(false)
  const [form, setForm] = useState<EditableProduct>(toEditable(null))
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')

  const selectedProduct = useMemo(() => products.find((p) => p.id === selectedId) ?? null, [products, selectedId])
  const previewSubImages = useMemo(() => form.sub_images_text.split('\n').map((v) => v.trim()).filter(Boolean), [form.sub_images_text])
  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) => p.product_name.toLowerCase().includes(q) || p.item_code.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q))
  }, [products, search])

  // ── 세션 확인 ──
  useEffect(() => {
    if (!supabase) { setAuthed(false); return }
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email === ADMIN_EMAIL) { setAuthed(true) }
      else { setAuthed(false) }
    })
  }, [])

  useEffect(() => { if (authed) loadProducts() }, [authed])

  useEffect(() => {
    if (selectedProduct && !editMode && !isNewMode) setForm(toEditable(selectedProduct))
  }, [selectedProduct, editMode, isNewMode])

  // ── 상품 로드 ──
  async function loadProducts() {
    if (!supabase) { setMessage('환경변수 설정이 없습니다.'); return }
    setLoading(true); setMessage('')
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    setLoading(false)
    if (error) { setMessage(`불러오기 오류: ${error.message}`); return }
    const rows = (data ?? []).map(normalizeProduct)
    setProducts(rows)
    if (rows.length > 0) {
      setSelectedId((prev) => prev || rows[0].id || '')
      setForm((prev) => (prev.id ? prev : toEditable(rows[0])))
    }
  }

  function handleSelectProduct(product: ProductRow) {
    setSelectedId(product.id || ''); setEditMode(false); setIsNewMode(false)
    setForm(toEditable(product)); setMessage('')
  }

  function handleStartEdit() {
    if (!selectedProduct) return
    setEditMode(true); setIsNewMode(false); setForm(toEditable(selectedProduct)); setMessage('')
  }

  function handleStartNew() {
    setIsNewMode(true); setEditMode(false); setSelectedId(''); setForm(emptyEditable()); setMessage('')
  }

  function handleCancelEdit() {
    setEditMode(false); setIsNewMode(false)
    setForm(toEditable(selectedProduct)); setMessage('수정을 취소했습니다.')
  }

  function handleChange<K extends keyof EditableProduct>(key: K, value: EditableProduct[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleGenerateHtml() {
    setForm((prev) => ({ ...prev, html: buildAutoHtml(form) }))
    setMessage('HTML 자동 생성이 적용되었습니다.')
  }

  // ── 저장 (수정) ──
  async function handleSave() {
    if (!supabase) { setMessage('Supabase 설정이 없습니다.'); return }
    if (!form.product_name.trim()) { setMessage('상품명을 입력해주세요.'); return }
    if (!form.item_code.trim()) { setMessage('품번을 입력해주세요.'); return }
    setSaving(true); setMessage('')
    const payload = {
      product_name: form.product_name.trim(), item_code: form.item_code.trim(),
      brand: form.brand.trim(), price: Number(form.price || 0),
      main_image: form.main_image.trim(),
      sub_images: form.sub_images_text.split('\n').map((v) => v.trim()).filter(Boolean),
      html: form.html,
    }
    const { error } = await supabase.from('products').update(payload).eq('id', form.id)
    setSaving(false)
    if (error) { setMessage(`저장 오류: ${error.message}`); return }
    setEditMode(false); setMessage('저장되었습니다.')
    await loadProducts(); setSelectedId(form.id!)
  }

  // ── 신규 등록 ──
  async function handleCreate() {
    if (!supabase) { setMessage('Supabase 설정이 없습니다.'); return }
    if (!form.product_name.trim()) { setMessage('상품명을 입력해주세요.'); return }
    if (!form.item_code.trim()) { setMessage('품번을 입력해주세요.'); return }
    setSaving(true); setMessage('')
    const payload = {
      product_name: form.product_name.trim(), item_code: form.item_code.trim(),
      brand: form.brand.trim(), price: Number(form.price || 0),
      main_image: form.main_image.trim(),
      sub_images: form.sub_images_text.split('\n').map((v) => v.trim()).filter(Boolean),
      html: form.html,
    }
    const { data, error } = await supabase.from('products').insert(payload).select().single()
    setSaving(false)
    if (error) { setMessage(`등록 오류: ${error.message}`); return }
    setIsNewMode(false); setMessage('신규 상품이 등록되었습니다.')
    await loadProducts(); if (data?.id) setSelectedId(data.id)
  }

  // ── 삭제 ──
  async function handleDelete() {
    if (!supabase || !selectedProduct?.id) return
    if (!window.confirm(`"${selectedProduct.product_name}" 상품을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return
    const { error } = await supabase.from('products').delete().eq('id', selectedProduct.id)
    if (error) { setMessage(`삭제 오류: ${error.message}`); return }
    setMessage('삭제되었습니다.'); setSelectedId(''); setForm(emptyEditable())
    await loadProducts()
  }

  // ── 엑셀 다운로드 ──
  async function downloadExcel() {
    const targetRows = editMode || isNewMode ? [{ product_name: form.product_name.trim(), item_code: form.item_code.trim(), brand: form.brand.trim(), price: form.price, main_image: form.main_image.trim(), sub_images: previewSubImages, html: form.html }]
      : selectedProduct ? [selectedProduct] : products
    if (!targetRows.length) { setMessage('다운로드할 상품이 없습니다.'); return }
    const XLSX = await import('xlsx')
    const sabangRows = targetRows.map((p: any) => ({
      상품명: p.product_name ?? '', 자체상품코드: p.item_code ?? '', 브랜드명: p.brand ?? '',
      판매가: p.price ?? '', 대표이미지: p.main_image ?? '',
      추가이미지: Array.isArray(p.sub_images) ? p.sub_images.join('\n') : '', 상세설명: p.html ?? '',
    }))
    const worksheet = XLSX.utils.json_to_sheet(sabangRows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '사방넷업로드')
    XLSX.writeFile(workbook, targetRows.length === 1 ? `${targetRows[0].item_code || 'product'}_sabang.xlsx` : 'products_sabang.xlsx')
    setMessage('엑셀 파일을 다운로드했습니다.')
  }

  function handleMenuClick(item: { name: string; desc: string; route?: string; tab?: Tab }) {
    if (item.route) { router.push(item.route); return }
    if (item.tab) { setActiveTab(item.tab); return }
    setMessage(`${item.name} 메뉴는 다음 단계에서 연결 예정입니다.`)
  }

  async function handleLogout() {
    if (supabase) await supabase.auth.signOut()
    setAuthed(false)
  }

  // ── 로딩 중 ──
  if (authed === null) {
    return <div className="flex min-h-screen items-center justify-center bg-neutral-100 text-sm text-neutral-400">로딩 중...</div>
  }

  // ── 로그인 화면 ──
  if (!authed) {
    return <LoginScreen onLogin={() => setAuthed(true)} />
  }

  const infoCards = [
    { title: '전체 상품', value: `${products.length}개`, sub: '등록 상품 수' },
    { title: '선택 상품', value: selectedProduct?.item_code || '-', sub: selectedProduct?.brand || '미선택' },
    { title: '현재 모드', value: isNewMode ? '신규등록' : editMode ? '수정모드' : '보기모드', sub: isNewMode ? '새 상품 입력 중' : editMode ? '실시간 라이브 프리뷰' : '상품 상세 상태' },
  ]

  const isEditing = editMode || isNewMode

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="mx-auto max-w-[1720px] px-4 py-4">

        {/* 헤더 */}
        <div className="mb-4 rounded-[28px] border border-neutral-200 bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <CharacterBadge />
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900">상품등록 운영페이지</h1>
                <p className="mt-1 text-sm text-neutral-500">상품 수정 · 상세 HTML 관리 · 사방넷 업로드용 엑셀 다운로드</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {infoCards.map((card) => (
                  <div key={card.title} className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                    <div className="text-xs font-medium text-neutral-500">{card.title}</div>
                    <div className="mt-1 text-lg font-bold text-neutral-900">{card.value}</div>
                    <div className="mt-1 text-xs text-neutral-500">{card.sub}</div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={handleLogout} className="rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50 whitespace-nowrap">
                로그아웃
              </button>
            </div>
          </div>
        </div>

        {message && (
          <div className="mb-4 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 shadow-sm">
            {message}
          </div>
        )}

        <div className="grid grid-cols-12 gap-4">

          {/* 사이드 메뉴 */}
          <aside className="col-span-12 xl:col-span-2">
            <div className="rounded-[24px] border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="mb-4 text-sm font-semibold text-neutral-900">운영 메뉴</div>
              <div className="space-y-2">
                {MENU_ITEMS.map((item) => (
                  <button key={item.name} type="button" onClick={() => handleMenuClick(item)}
                    className={`group w-full rounded-2xl border px-4 py-3 text-left transition ${item.tab === activeTab ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-200 bg-white hover:bg-neutral-50'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`text-sm font-semibold ${item.tab === activeTab ? 'text-white' : 'text-neutral-900'}`}>{item.name}</div>
                        <div className={`text-[11px] ${item.tab === activeTab ? 'text-neutral-300' : 'text-neutral-500'}`}>{item.desc}</div>
                      </div>
                      <span className={`${item.tab === activeTab ? 'text-neutral-300' : 'text-neutral-300 group-hover:text-neutral-500'}`}>›</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* 승인관리 탭 */}
          {activeTab === 'approvals' ? (
            <div className="col-span-12 xl:col-span-10">
              <ApprovalsPanel />
            </div>
          ) : (
            <>
              {/* 상품 목록 */}
              <section className="col-span-12 xl:col-span-3">
                <div className="rounded-[24px] border border-neutral-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <div className="text-base font-semibold text-neutral-900">상품 목록</div>
                      <div className="text-xs text-neutral-500">상품 선택 시 우측에 상세정보가 표시됩니다</div>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={handleStartNew} className="rounded-xl bg-neutral-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-neutral-700">+ 신규</button>
                      <button type="button" onClick={loadProducts} className="rounded-xl border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50">새로고침</button>
                    </div>
                  </div>
                  <div className="mb-3">
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="상품명 / 품번 / 브랜드 검색"
                      className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-neutral-400 focus:bg-white" />
                  </div>
                  <div className="max-h-[900px] space-y-3 overflow-auto pr-1">
                    {loading ? (
                      <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-10 text-center text-sm text-neutral-400">상품을 불러오는 중입니다.</div>
                    ) : filteredProducts.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-10 text-center text-sm text-neutral-400">표시할 상품이 없습니다.</div>
                    ) : (
                      filteredProducts.map((product) => {
                        const active = product.id === selectedId
                        return (
                          <button key={product.id || product.item_code} type="button" onClick={() => handleSelectProduct(product)}
                            className={`w-full rounded-2xl border p-3 text-left transition ${active ? 'border-neutral-900 bg-neutral-900 text-white shadow-md' : 'border-neutral-200 bg-white hover:bg-neutral-50'}`}>
                            <div className="flex gap-3">
                              <div className="h-20 w-20 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
                                {product.main_image ? (
                                  <img src={product.main_image} alt={product.product_name} className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-[11px] text-neutral-400">NO IMAGE</div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className={`line-clamp-2 text-sm font-semibold ${active ? 'text-white' : 'text-neutral-900'}`}>{product.product_name || '상품명 없음'}</div>
                                <div className={`mt-2 text-xs ${active ? 'text-neutral-200' : 'text-neutral-500'}`}>{product.item_code || '-'}</div>
                                <div className="mt-2 flex items-center gap-2">
                                  <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${active ? 'bg-white/15 text-white' : 'bg-neutral-100 text-neutral-700'}`}>{product.brand || '-'}</span>
                                  <span className={`text-xs ${active ? 'text-neutral-200' : 'text-neutral-500'}`}>{product.price || 0}원</span>
                                </div>
                              </div>
                            </div>
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>
              </section>

              {/* 상품 상세 */}
              <section className="col-span-12 xl:col-span-7">
                <div className="rounded-[24px] border border-neutral-200 bg-white p-4 shadow-sm">
                  {!selectedProduct && !isNewMode ? (
                    <div className="flex min-h-[760px] flex-col items-center justify-center gap-4 rounded-[22px] border border-dashed border-neutral-300 bg-neutral-50 text-neutral-400">
                      <div className="text-sm">좌측 상품을 선택하거나 신규 상품을 등록하세요.</div>
                      <button type="button" onClick={handleStartNew} className="rounded-2xl bg-neutral-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-neutral-700">+ 신규 상품 등록</button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* 상단 액션바 */}
                      <div className="flex flex-col gap-3 rounded-[22px] border border-neutral-200 bg-gradient-to-r from-neutral-900 to-neutral-800 p-4 text-white lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="text-lg font-bold">{isNewMode ? '신규 상품 등록' : editMode ? '상품 수정 모드' : '상품 상세 보기'}</div>
                          <div className="mt-1 text-sm text-neutral-200">기본정보 · 이미지 · 상세 HTML · 자동생성 · 사방넷 엑셀 다운로드</div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {isNewMode ? (
                            <>
                              <button type="button" onClick={handleGenerateHtml} className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20">HTML 자동 생성</button>
                              <button type="button" onClick={handleCreate} disabled={saving} className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-neutral-900 transition hover:bg-neutral-100 disabled:opacity-60">{saving ? '등록중...' : '등록'}</button>
                              <button type="button" onClick={handleCancelEdit} className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20">취소</button>
                            </>
                          ) : !editMode ? (
                            <>
                              <button type="button" onClick={handleStartEdit} className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100">편집</button>
                              <button type="button" onClick={handleDelete} className="rounded-xl border border-red-400/40 bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/40">삭제</button>
                            </>
                          ) : (
                            <>
                              <button type="button" onClick={handleGenerateHtml} className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20">HTML 자동 생성</button>
                              <button type="button" onClick={handleSave} disabled={saving} className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100 disabled:opacity-60">{saving ? '저장중...' : '저장'}</button>
                              <button type="button" onClick={handleCancelEdit} className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20">취소</button>
                            </>
                          )}
                          <button type="button" onClick={downloadExcel} className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20">사방넷 엑셀 다운로드</button>
                        </div>
                      </div>

                      {/* 폼 + 프리뷰 */}
                      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[1.1fr_1fr]">
                        <div className="space-y-4">
                          <div className="rounded-[22px] border border-neutral-200 bg-neutral-50 p-4">
                            <div className="mb-4 flex items-center justify-between">
                              <div>
                                <div className="text-base font-semibold text-neutral-900">상품 기본 정보</div>
                                <div className="text-xs text-neutral-500">{isEditing ? '편집 시 우측 프리뷰가 즉시 반영됩니다' : '읽기 전용'}</div>
                              </div>
                              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-neutral-700">{form.item_code || '-'}</span>
                            </div>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                              <Field label="상품명"><input value={form.product_name} onChange={(e) => handleChange('product_name', e.target.value)} disabled={!isEditing} className={inputClass(isEditing)} /></Field>
                              <Field label="품번"><input value={form.item_code} onChange={(e) => handleChange('item_code', e.target.value)} disabled={!isEditing} className={inputClass(isEditing)} /></Field>
                              <Field label="브랜드">
                                <select value={form.brand} onChange={(e) => handleChange('brand', e.target.value)} disabled={!isEditing} className={inputClass(isEditing)}>
                                  {BRAND_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                                </select>
                              </Field>
                              <Field label="가격"><input value={form.price} onChange={(e) => handleChange('price', e.target.value)} disabled={!isEditing} className={inputClass(isEditing)} /></Field>
                              <div className="md:col-span-2"><Field label="대표이미지 URL"><input value={form.main_image} onChange={(e) => handleChange('main_image', e.target.value)} disabled={!isEditing} className={inputClass(isEditing)} /></Field></div>
                              <div className="md:col-span-2"><Field label="추가이미지 URL"><textarea value={form.sub_images_text} onChange={(e) => handleChange('sub_images_text', e.target.value)} disabled={!isEditing} rows={6} className={textareaClass(isEditing)} placeholder="한 줄에 1개 URL씩 입력" /></Field></div>
                            </div>
                          </div>
                          <div className="rounded-[22px] border border-neutral-200 bg-neutral-50 p-4">
                            <div className="mb-4 flex items-center justify-between">
                              <div className="text-base font-semibold text-neutral-900">상세 HTML 편집</div>
                              {isEditing && <button type="button" onClick={handleGenerateHtml} className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-100">자동 생성</button>}
                            </div>
                            <textarea value={form.html} onChange={(e) => handleChange('html', e.target.value)} disabled={!isEditing} rows={18} className={textareaClass(isEditing)} placeholder="<div>상세페이지 HTML</div>" />
                          </div>
                        </div>

                        {/* 프리뷰 */}
                        <div className="space-y-4">
                          <div className="rounded-[22px] border border-neutral-200 bg-neutral-50 p-4">
                            <div className="mb-3 text-base font-semibold text-neutral-900">대표이미지</div>
                            <div className="overflow-hidden rounded-[20px] border border-neutral-200 bg-white">
                              {form.main_image ? <img src={form.main_image} alt="대표이미지" className="h-[360px] w-full object-cover" /> : <div className="flex h-[360px] items-center justify-center text-sm text-neutral-400">대표이미지 없음</div>}
                            </div>
                          </div>
                          <div className="rounded-[22px] border border-neutral-200 bg-neutral-50 p-4">
                            <div className="mb-3 text-base font-semibold text-neutral-900">추가이미지 미리보기</div>
                            {previewSubImages.length > 0 ? (
                              <div className="grid grid-cols-3 gap-3">
                                {previewSubImages.map((img, idx) => (
                                  <div key={`${img}-${idx}`} className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                                    <img src={img} alt={`sub-${idx + 1}`} className="aspect-square w-full object-cover" />
                                  </div>
                                ))}
                              </div>
                            ) : <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-4 py-10 text-center text-sm text-neutral-400">추가이미지 없음</div>}
                          </div>
                          <div className="rounded-[22px] border border-neutral-200 bg-neutral-50 p-4">
                            <div className="mb-3 text-base font-semibold text-neutral-900">상세페이지 라이브 프리뷰</div>
                            <div className="max-h-[700px] overflow-auto rounded-[20px] border border-neutral-200 bg-white">
                              {form.html.trim() ? <div className="p-4" dangerouslySetInnerHTML={{ __html: form.html }} /> : <div className="px-4 py-10 text-center text-sm text-neutral-400">HTML 내용이 없습니다.</div>}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-semibold text-neutral-700">{label}</div>
      {children}
    </label>
  )
}

function inputClass(enabled: boolean) {
  return `w-full rounded-2xl border px-4 py-3 text-sm outline-none transition ${enabled ? 'border-neutral-200 bg-white focus:border-neutral-400' : 'border-neutral-200 bg-white text-neutral-900'}`
}

function textareaClass(enabled: boolean) {
  return `w-full rounded-2xl border px-4 py-3 text-sm outline-none transition ${enabled ? 'border-neutral-200 bg-white focus:border-neutral-400' : 'border-neutral-200 bg-white text-neutral-900'}`
}
