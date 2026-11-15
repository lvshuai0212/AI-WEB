<template>
  <div class="drugs-page">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>药品管理</span>
          <div class="header-actions">
            <el-input v-model="searchKey" placeholder="搜索药品名/通用名/症状" clearable style="width: 220px" prefix-icon="Search" />
            <el-select v-model="filterCategory" placeholder="分类筛选" clearable style="width: 130px">
              <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
            </el-select>
            <el-select v-model="filterOtc" placeholder="处方类型" clearable style="width: 130px">
              <el-option label="OTC 非处方药" value="otc" />
              <el-option label="处方药" value="rx" />
            </el-select>
            <el-select v-model="filterStock" placeholder="库存状态" clearable style="width: 120px">
              <el-option label="库存充足" value="ok" />
              <el-option label="库存紧张" value="low" />
              <el-option label="已缺货" value="empty" />
            </el-select>
            <el-button type="primary" @click="openDialog()">
              <el-icon><Plus /></el-icon> 新增药品
            </el-button>
          </div>
        </div>
      </template>

      <div class="table-scroll">
        <el-table :data="pagedData" stripe border v-loading="loading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column label="封面" width="76">
          <template #default="{ row }">
            <div class="cover-tile" :style="{ background: coverMeta(row.category).bg, color: coverMeta(row.category).color }">
              {{ coverMeta(row.category).icon }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="药品" min-width="200">
          <template #default="{ row }">
            <div class="drug-name">{{ row.name }}</div>
            <div class="drug-generic">{{ row.genericName }} · {{ row.spec }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="100" />
        <el-table-column label="处方类型" width="110">
          <template #default="{ row }">
            <el-tag :type="row.otc ? 'success' : 'danger'" size="small">{{ row.otc ? 'OTC' : '处方药' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="price" label="单价" width="90">
          <template #default="{ row }">¥{{ row.price }}</template>
        </el-table-column>
        <el-table-column label="库存" width="110">
          <template #default="{ row }">
            <el-tag :type="stockType(row.stock)" size="small" effect="light">{{ row.stock }} 件</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="上架状态" width="110">
          <template #default="{ row }">
            <el-switch :model-value="row.status === 'on'" @change="toggleStatus(row)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="210" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="openStock(row)">库存调整</el-button>
            <el-button type="warning" link @click="openDialog(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
        </el-table>
      </div>

      <div class="table-footer">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="filteredData.length"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑药品' : '新增药品'" width="720px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="药品名" prop="name">
              <el-input v-model="form.name" placeholder="如：布洛芬缓释胶囊" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="通用名" prop="genericName">
              <el-input v-model="form.genericName" placeholder="如：布洛芬" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分类" prop="category">
              <el-select v-model="form.category" placeholder="选择分类" allow-create filterable style="width: 100%">
                <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="处方类型">
              <el-radio-group v-model="form.otc">
                <el-radio :value="true">OTC 非处方药</el-radio>
                <el-radio :value="false">处方药</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="规格" prop="spec">
              <el-input v-model="form.spec" placeholder="如：0.3g×20粒" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单价" prop="price">
              <el-input-number v-model="form.price" :min="0" :precision="2" :step="0.5" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="库存" prop="stock">
              <el-input-number v-model="form.stock" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="上架状态">
              <el-radio-group v-model="form.status">
                <el-radio value="on">上架</el-radio>
                <el-radio value="off">下架</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="症状关键词">
              <el-input v-model="symptomText" placeholder="用顿号或逗号分隔，如：头痛、发热、牙痛（用于 AI 检索匹配）" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="用法用量" prop="usage">
              <el-input v-model="form.usage" type="textarea" :rows="2" placeholder="如：口服，成人一次1粒，一日2次，餐后服用" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="禁忌注意" prop="contraindications">
              <el-input v-model="form.contraindications" type="textarea" :rows="2" placeholder="禁忌症、注意事项、配伍禁忌" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="适用人群">
              <el-input v-model="form.audience" placeholder="如：成人及12岁以上；孕妇禁用" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="封面图">
              <el-select v-model="form.cover" style="width: 100%">
                <el-option v-for="img in DRUG_IMAGES" :key="img" :label="img" :value="img" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="stockVisible" title="库存调整" width="420px" destroy-on-close>
      <div v-if="stockRow" class="stock-panel">
        <div class="stock-drug">{{ stockRow.name }}</div>
        <div class="stock-now">当前库存：<b>{{ stockRow.stock }}</b> 件</div>
        <el-input-number v-model="stockDelta" :step="1" style="width: 100%" />
        <div class="stock-tip">输入正数入库、负数出库，调整后库存：{{ Math.max(0, Number(stockRow.stock) + Number(stockDelta || 0)) }} 件</div>
      </div>
      <template #footer>
        <el-button @click="stockVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitStock">确定调整</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getDrugs, createDrug, updateDrug, deleteDrug } from '../utils/api'

const DRUG_IMAGES = ['/image/1.jpg', '/image/2.jpg', '/image/3.jpg', '/image/4.jpg', '/image/5.jpg', '/image/6.jpg', '/image/7.jpg', '/image/8.jpg', '/image/9.jpg']
const defaultCategories = ['感冒用药', '解热镇痛', '胃肠用药', '抗过敏', '外用', '维生素', '止咳化痰']
const COVER_MAP = {
  '感冒用药': { icon: '🤧', bg: '#EAF3FF', color: '#3D6FD4' },
  '解热镇痛': { icon: '🌡️', bg: '#FFF1E6', color: '#D97706' },
  '胃肠用药': { icon: '🥣', bg: '#FFF7E6', color: '#B7791F' },
  '抗过敏': { icon: '🌿', bg: '#E9F9F0', color: '#219653' },
  '外用': { icon: '🩹', bg: '#FDECEC', color: '#C0392B' },
  '维生素': { icon: '🍊', bg: '#FFF6DA', color: '#B9770E' },
  '止咳化痰': { icon: '🫖', bg: '#F0F4FF', color: '#5B6ABF' },
  '抗感染': { icon: '💊', bg: '#FDECEC', color: '#C0392B' },
  '慢病处方': { icon: '❤️', bg: '#FFEDF1', color: '#C2185B' }
}
const coverMeta = (category) => COVER_MAP[category] || { icon: '💊', bg: '#EFF9F8', color: '#127F79' }

const loading = ref(false)
const tableData = ref([])
const searchKey = ref('')
const filterCategory = ref('')
const filterOtc = ref('')
const filterStock = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const dialogVisible = ref(false)
const stockVisible = ref(false)
const stockRow = ref(null)
const stockDelta = ref(0)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref(null)
const symptomText = ref('')

function emptyForm() {
  return {
    id: null, name: '', genericName: '', category: '感冒用药', otc: true, symptoms: [],
    usage: '', spec: '', price: 0, stock: 0, contraindications: '', audience: '',
    cover: '/image/2.jpg', status: 'on'
  }
}

const form = reactive(emptyForm())

const rules = {
  name: [{ required: true, message: '请输入药品名', trigger: 'blur' }],
  genericName: [{ required: true, message: '请输入通用名', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  spec: [{ required: true, message: '请输入规格', trigger: 'blur' }],
  price: [{ required: true, message: '请输入单价', trigger: 'blur' }],
  stock: [{ required: true, message: '请输入库存', trigger: 'blur' }],
  usage: [{ required: true, message: '请输入用法用量', trigger: 'blur' }],
  contraindications: [{ required: true, message: '请输入禁忌注意事项', trigger: 'blur' }]
}

const categories = computed(() => {
  const set = new Set(defaultCategories)
  tableData.value.forEach(d => d.category && set.add(d.category))
  return [...set]
})

const filteredData = computed(() => {
  let list = tableData.value
  if (filterCategory.value) list = list.filter(d => d.category === filterCategory.value)
  if (filterOtc.value) list = list.filter(d => (filterOtc.value === 'otc' ? d.otc : !d.otc))
  if (filterStock.value) {
    list = list.filter(d => {
      const s = Number(d.stock) || 0
      if (filterStock.value === 'empty') return s <= 0
      if (filterStock.value === 'low') return s > 0 && s <= 10
      return s > 10
    })
  }
  const key = searchKey.value.trim().toLowerCase()
  if (key) {
    list = list.filter(d =>
      String(d.name).toLowerCase().includes(key) ||
      String(d.genericName).toLowerCase().includes(key) ||
      String(d.category).toLowerCase().includes(key) ||
      (d.symptoms || []).some(s => String(s).toLowerCase().includes(key))
    )
  }
  return list
})

const pagedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredData.value.slice(start, start + pageSize.value)
})

function stockType(stock) {
  const s = Number(stock) || 0
  if (s <= 0) return 'danger'
  if (s <= 10) return 'warning'
  return 'success'
}

async function loadData() {
  loading.value = true
  try { tableData.value = await getDrugs() }
  finally { loading.value = false }
}

function openDialog(row) {
  isEdit.value = !!row
  if (row) {
    Object.assign(form, { ...emptyForm(), ...row })
    symptomText.value = (row.symptoms || []).join('、')
  } else {
    Object.assign(form, emptyForm())
    symptomText.value = ''
  }
  dialogVisible.value = true
}

async function handleSubmit() {
  await formRef.value.validate()
  submitting.value = true
  try {
    const payload = {
      ...form,
      price: Number(form.price) || 0,
      stock: Number(form.stock) || 0,
      symptoms: symptomText.value.split(/[、,，\s]+/).map(s => s.trim()).filter(Boolean)
    }
    if (isEdit.value) {
      await updateDrug(form.id, payload)
      ElMessage.success('编辑成功，居民端与 AI 推荐范围已同步')
    } else {
      await createDrug(payload)
      ElMessage.success('新增成功，居民端药库可立即查看')
    }
    dialogVisible.value = false
    loadData()
  } catch {
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

async function toggleStatus(row) {
  const next = row.status === 'on' ? 'off' : 'on'
  try {
    await updateDrug(row.id, { ...row, status: next })
    row.status = next
    ElMessage.success(next === 'on' ? `「${row.name}」已上架` : `「${row.name}」已下架，AI 将不再推荐`)
  } catch {
    ElMessage.error('状态修改失败')
  }
}

function openStock(row) {
  stockRow.value = row
  stockDelta.value = 0
  stockVisible.value = true
}

async function submitStock() {
  if (!stockRow.value) return
  submitting.value = true
  try {
    const next = Math.max(0, Number(stockRow.value.stock) + Number(stockDelta.value || 0))
    await updateDrug(stockRow.value.id, { ...stockRow.value, stock: next })
    ElMessage.success('库存已更新')
    stockVisible.value = false
    loadData()
  } catch {
    ElMessage.error('库存更新失败')
  } finally {
    submitting.value = false
  }
}

function handleDelete(row) {
  ElMessageBox.confirm(`确定删除药品「${row.name}」吗？`, '删除确认', { type: 'warning' })
    .then(async () => {
      await deleteDrug(row.id)
      ElMessage.success('删除成功')
      loadData()
    }).catch(() => {})
}

onMounted(loadData)
</script>

<style scoped>
.drugs-page { min-width: 0; }
.card-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
.header-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.table-scroll { width: 100%; overflow-x: auto; }
.table-scroll :deep(.el-table) { min-width: 1060px; }
.table-footer { display: flex; justify-content: flex-end; margin-top: 16px; }
.table-footer :deep(.el-pagination) { max-width: 100%; flex-wrap: wrap; row-gap: 8px; }

@media screen and (max-width: 1280px) {
  .header-actions { width: 100%; }
}
.drug-name { font-weight: 600; color: #0B3B48; }
.cover-tile {
  width: 44px; height: 44px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center; font-size: 20px;
}
.drug-generic { font-size: 12px; color: #8E9AAB; margin-top: 2px; }
.stock-panel { display: flex; flex-direction: column; gap: 14px; }
.stock-drug { font-size: 16px; font-weight: 600; color: #0B3B48; }
.stock-now { font-size: 14px; color: #5A6B75; }
.stock-tip { font-size: 12px; color: #8E9AAB; }
</style>
