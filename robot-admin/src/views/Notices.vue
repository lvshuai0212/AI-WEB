<template>
  <div class="page-wrap">
    <el-card shadow="never" class="page-card">
      <template #header>
        <div class="card-head">
          <div>
            <h3>健康提醒公告</h3>
            <p>发布服药、复诊、体检等健康提醒，居民端首页与提醒页同步展示</p>
          </div>
          <div class="head-actions">
            <el-input v-model="searchKey" placeholder="搜索标题" clearable prefix-icon="Search" style="width:220px" />
            <el-button type="primary" @click="openDialog()"><el-icon><Plus /></el-icon> 新增提醒</el-button>
          </div>
        </div>
      </template>

      <div class="table-scroll">
        <el-table :data="filtered" stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="type" label="类型" width="90">
          <template #default="{ row }"><el-tag size="small" :type="typeColor[row.type]">{{ row.type }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="publishDate" label="发布日期" width="120" />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 'published' ? 'success' : 'info'" size="small">{{ row.status === 'published' ? '已发布' : '草稿' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewDetail(row)">详情</el-button>
            <el-button link type="warning" @click="openDialog(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
        </el-table>
      </div>
    </el-card>

    <el-dialog v-model="visible" :title="isEdit ? '编辑健康提醒' : '新增健康提醒'" width="600px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="标题" prop="title"><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="form.type">
            <el-option label="服药提醒" value="服药提醒" />
            <el-option label="复诊提醒" value="复诊提醒" />
            <el-option label="体检通知" value="体检通知" />
          </el-select>
        </el-form-item>
        <el-form-item label="发布日期" prop="publishDate">
          <el-date-picker v-model="form.publishDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio value="published">已发布</el-radio>
            <el-radio value="draft">草稿</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="内容" prop="content"><el-input v-model="form.content" type="textarea" :rows="5" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="健康提醒详情" width="560px">
      <el-descriptions :column="1" border v-if="detail">
        <el-descriptions-item label="标题">{{ detail.title }}</el-descriptions-item>
        <el-descriptions-item label="类型">{{ detail.type }}</el-descriptions-item>
        <el-descriptions-item label="日期">{{ detail.publishDate }}</el-descriptions-item>
        <el-descriptions-item label="内容"><div style="line-height:1.8">{{ detail.content }}</div></el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getNotices, createNotice, updateNotice, deleteNotice } from '../utils/api'

const typeColor = { '服药提醒': 'warning', '复诊提醒': 'success', '体检通知': '' }
const loading = ref(false)
const tableData = ref([])
const searchKey = ref('')
const visible = ref(false)
const detailVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const detail = ref(null)
const formRef = ref(null)
const form = reactive({ id: null, title: '', content: '', type: '服药提醒', publishDate: new Date().toISOString().split('T')[0], status: 'published' })
const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }],
  publishDate: [{ required: true, message: '请选择日期', trigger: 'change' }]
}

const filtered = computed(() => {
  if (!searchKey.value) return tableData.value
  return tableData.value.filter(n => n.title.includes(searchKey.value))
})

async function loadData() {
  loading.value = true
  try { tableData.value = await getNotices() }
  finally { loading.value = false }
}

function openDialog(row) {
  isEdit.value = !!row
  if (row) Object.assign(form, { ...row })
  else Object.assign(form, { id: null, title: '', content: '', type: '服药提醒', publishDate: new Date().toISOString().split('T')[0], status: 'published' })
  visible.value = true
}

function viewDetail(row) { detail.value = row; detailVisible.value = true }

async function submit() {
  await formRef.value.validate()
  submitting.value = true
  try {
    if (isEdit.value) { await updateNotice(form.id, { ...form }); ElMessage.success('编辑成功，居民端将同步') }
    else { await createNotice({ ...form }); ElMessage.success('新增成功') }
    visible.value = false; loadData()
  } catch { ElMessage.error('操作失败') }
  finally { submitting.value = false }
}

function handleDelete(row) {
  ElMessageBox.confirm(`删除健康提醒「${row.title}」？`, '确认', { type: 'warning' })
    .then(async () => { await deleteNotice(row.id); ElMessage.success('已删除'); loadData() }).catch(() => {})
}

onMounted(loadData)
</script>

<style scoped>
.page-card { border-radius: 16px; border: none; }
.card-head { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
.table-scroll { width: 100%; overflow-x: auto; }
.table-scroll :deep(.el-table) { min-width: 760px; }
.card-head h3 { margin: 0 0 4px; font-size: 18px; color: #0B3B48; }
.card-head p { margin: 0; font-size: 13px; color: #999; }
.head-actions { display: flex; gap: 12px; }
</style>
