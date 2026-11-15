<template>
  <div class="knowledge-page">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>健康科普管理</span>
          <div class="header-actions">
            <el-input v-model="searchKey" placeholder="搜索标题/分类" clearable style="width: 220px" prefix-icon="Search" />
            <el-select v-model="filterCategory" placeholder="分类筛选" clearable style="width: 140px">
              <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
            </el-select>
            <el-button type="primary" @click="openDialog()">
              <el-icon><Plus /></el-icon> 新增科普文章
            </el-button>
          </div>
        </div>
      </template>

      <div class="table-scroll">
        <el-table :data="pagedData" stripe border v-loading="loading">
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column prop="title" label="标题" min-width="220" show-overflow-tooltip />
          <el-table-column prop="category" label="分类" width="110" />
          <el-table-column prop="duration" label="阅读时长" width="100" />
          <el-table-column prop="readCount" label="阅读量" width="90" />
          <el-table-column prop="publishDate" label="发布日期" width="120" />
          <el-table-column prop="status" label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="row.status === 'published' ? 'success' : 'info'" size="small">
                {{ row.status === 'published' ? '已发布' : '草稿' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link @click="viewDetail(row)">详情</el-button>
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
          :page-sizes="[5, 10, 20]"
          layout="total, sizes, prev, pager, next"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑科普文章' : '新增科普文章'" width="640px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="如：高血压患者如何正确测量血压" />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="form.category" placeholder="选择分类" allow-create filterable>
            <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="阅读时长" prop="duration">
          <el-input v-model="form.duration" placeholder="3分钟" />
        </el-form-item>
        <el-form-item label="阅读量">
          <el-input-number v-model="form.readCount" :min="0" />
        </el-form-item>
        <el-form-item label="发布日期" prop="publishDate">
          <el-date-picker v-model="form.publishDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio value="published">已发布</el-radio>
            <el-radio value="draft">草稿</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="摘要" prop="summary">
          <el-input v-model="form.summary" type="textarea" :rows="2" placeholder="一句话概括本文要点，展示在居民端列表" />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input v-model="form.content" type="textarea" :rows="6" placeholder="健康科普正文，语言通俗易懂..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="科普文章详情" width="640px">
      <el-descriptions :column="1" border v-if="detailRow">
        <el-descriptions-item label="标题">{{ detailRow.title }}</el-descriptions-item>
        <el-descriptions-item label="分类">{{ detailRow.category }}</el-descriptions-item>
        <el-descriptions-item label="摘要">{{ detailRow.summary || '-' }}</el-descriptions-item>
        <el-descriptions-item label="阅读时长">{{ detailRow.duration }}</el-descriptions-item>
        <el-descriptions-item label="阅读量">{{ detailRow.readCount ?? 0 }}</el-descriptions-item>
        <el-descriptions-item label="发布日期">{{ detailRow.publishDate }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="detailRow.status === 'published' ? 'success' : 'info'" size="small">
            {{ detailRow.status === 'published' ? '已发布' : '草稿' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="内容">
          <div style="line-height: 1.8; white-space: pre-wrap">{{ detailRow.content }}</div>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getKnowledge, createKnowledge, updateKnowledge, deleteKnowledge } from '../utils/api'

const categories = ['慢病管理', '饮食营养', '运动健身', '用药指导', '心理健康', '急救常识']

const loading = ref(false)
const tableData = ref([])
const searchKey = ref('')
const filterCategory = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const dialogVisible = ref(false)
const detailVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const detailRow = ref(null)
const formRef = ref(null)

function emptyForm() {
  return {
    id: null, title: '', category: '慢病管理', duration: '3分钟', readCount: 0, summary: '',
    content: '', publishDate: new Date().toISOString().split('T')[0], status: 'published'
  }
}

const form = reactive(emptyForm())

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  summary: [{ required: true, message: '请输入摘要', trigger: 'blur' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }],
  publishDate: [{ required: true, message: '请选择日期', trigger: 'change' }]
}

const filteredData = computed(() => {
  let list = tableData.value
  if (filterCategory.value) list = list.filter(k => k.category === filterCategory.value)
  if (searchKey.value) {
    const key = searchKey.value.toLowerCase()
    list = list.filter(k => k.title.toLowerCase().includes(key) || k.category.toLowerCase().includes(key))
  }
  return list
})

const pagedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredData.value.slice(start, start + pageSize.value)
})

async function loadData() {
  loading.value = true
  try { tableData.value = await getKnowledge() }
  finally { loading.value = false }
}

function openDialog(row) {
  isEdit.value = !!row
  if (row) Object.assign(form, { ...emptyForm(), ...row })
  else Object.assign(form, emptyForm())
  dialogVisible.value = true
}

function viewDetail(row) {
  detailRow.value = row
  detailVisible.value = true
}

async function handleSubmit() {
  await formRef.value.validate()
  submitting.value = true
  try {
    if (isEdit.value) {
      await updateKnowledge(form.id, { ...form })
      ElMessage.success('编辑成功，居民端将同步更新')
    } else {
      await createKnowledge({ ...form })
      ElMessage.success('新增成功，居民端可立即查看')
    }
    dialogVisible.value = false
    loadData()
  } catch {
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

function handleDelete(row) {
  ElMessageBox.confirm(`确定删除科普文章「${row.title}」吗？`, '删除确认', { type: 'warning' })
    .then(async () => {
      await deleteKnowledge(row.id)
      ElMessage.success('删除成功')
      loadData()
    }).catch(() => {})
}

onMounted(loadData)
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.header-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.table-scroll { width: 100%; overflow-x: auto; }
.table-scroll :deep(.el-table) { min-width: 1010px; }

@media screen and (max-width: 1280px) {
  .header-actions { width: 100%; }
}

.table-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
