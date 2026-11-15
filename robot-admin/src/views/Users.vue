<template>
  <div class="users-page">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>居民健康档案</span>
          <div class="header-actions">
            <el-input v-model="searchKey" placeholder="搜索姓名/手机号/社区" clearable style="width: 240px" prefix-icon="Search" />
            <el-button type="primary" @click="openDialog()">
              <el-icon><Plus /></el-icon> 新增居民
            </el-button>
          </div>
        </div>
      </template>

      <div class="table-scroll">
        <el-table :data="pagedData" stripe border v-loading="loading" @selection-change="sel => selections = sel">
          <el-table-column type="selection" width="50" />
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column prop="nickname" label="姓名" width="90" />
          <el-table-column prop="gender" label="性别" width="65" />
          <el-table-column prop="age" label="年龄" width="65" />
          <el-table-column prop="phone" label="手机号" width="120" />
          <el-table-column prop="className" label="所属社区" width="110" />
          <el-table-column prop="chronicTags" label="慢病标签" min-width="150" show-overflow-tooltip />
          <el-table-column prop="totalPoints" label="健康积分" width="95" sortable />
          <el-table-column prop="continuousDays" label="连续打卡" width="95" />
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link @click="viewDetail(row)">详情</el-button>
              <el-button type="warning" link @click="openDialog(row)">编辑</el-button>
              <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="table-footer">
        <el-button type="danger" :disabled="!selections.length" @click="handleBatchDelete">
          批量删除 ({{ selections.length }})
        </el-button>
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="filteredData.length"
          :page-sizes="[5, 10, 20]"
          layout="total, sizes, prev, pager, next"
        />
      </div>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑居民档案' : '新增居民档案'" width="520px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="姓名" prop="nickname">
          <el-input v-model="form.nickname" />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="form.gender">
            <el-radio value="男">男</el-radio>
            <el-radio value="女">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="年龄" prop="age">
          <el-input-number v-model="form.age" :min="0" :max="120" />
        </el-form-item>
        <el-form-item label="所属社区" prop="className">
          <el-input v-model="form.className" placeholder="如：康乐社区" />
        </el-form-item>
        <el-form-item label="慢病标签" prop="chronicTags">
          <el-input v-model="form.chronicTags" placeholder="如：高血压、2型糖尿病，无则填「无」" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="健康积分">
          <el-input-number v-model="form.totalPoints" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="居民健康档案详情" width="520px">
      <el-descriptions :column="1" border v-if="detailRow">
        <el-descriptions-item label="ID">{{ detailRow.id }}</el-descriptions-item>
        <el-descriptions-item label="姓名">{{ detailRow.nickname }}</el-descriptions-item>
        <el-descriptions-item label="性别">{{ detailRow.gender || '-' }}</el-descriptions-item>
        <el-descriptions-item label="年龄">{{ detailRow.age || '-' }} 岁</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ detailRow.phone }}</el-descriptions-item>
        <el-descriptions-item label="所属社区">{{ detailRow.className }}</el-descriptions-item>
        <el-descriptions-item label="慢病标签">{{ detailRow.chronicTags || '无' }}</el-descriptions-item>
        <el-descriptions-item label="健康积分">{{ detailRow.totalPoints }}</el-descriptions-item>
        <el-descriptions-item label="连续打卡">{{ detailRow.continuousDays }} 天</el-descriptions-item>
        <el-descriptions-item label="累计打卡">{{ detailRow.totalCheckins }} 次</el-descriptions-item>
        <el-descriptions-item label="建档时间">{{ formatDate(detailRow.registerTime) }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUsers, createUser, updateUser, deleteUser } from '../utils/api'

const loading = ref(false)
const tableData = ref([])
const searchKey = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const selections = ref([])
const dialogVisible = ref(false)
const detailVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const detailRow = ref(null)
const formRef = ref(null)

function emptyForm() {
  return { id: null, phone: '', nickname: '', gender: '女', age: 65, className: '康乐社区', chronicTags: '无', password: '123456', totalPoints: 0 }
}

const form = reactive(emptyForm())

const rules = {
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  nickname: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  age: [{ required: true, message: '请输入年龄', trigger: 'blur' }],
  className: [{ required: true, message: '请输入所属社区', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const filteredData = computed(() => {
  if (!searchKey.value) return tableData.value
  const key = searchKey.value.toLowerCase()
  return tableData.value.filter(u =>
    u.nickname?.toLowerCase().includes(key) ||
    u.phone?.includes(key) ||
    u.className?.toLowerCase().includes(key)
  )
})

const pagedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredData.value.slice(start, start + pageSize.value)
})

function formatDate(str) {
  if (!str) return '-'
  return new Date(str).toLocaleString('zh-CN')
}

async function loadData() {
  loading.value = true
  try {
    tableData.value = await getUsers()
  } finally {
    loading.value = false
  }
}

function openDialog(row) {
  isEdit.value = !!row
  if (row) {
    Object.assign(form, { ...emptyForm(), ...row })
  } else {
    Object.assign(form, emptyForm())
  }
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
      await updateUser(form.id, { ...form })
      ElMessage.success('档案已更新')
    } else {
      await createUser({
        ...form,
        continuousDays: 0,
        totalCheckins: 0,
        registerTime: new Date().toISOString(),
        avatar: ''
      })
      ElMessage.success('居民档案已新增')
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
  ElMessageBox.confirm(`确定删除居民「${row.nickname}」的健康档案吗？`, '删除确认', { type: 'warning' })
    .then(async () => {
      await deleteUser(row.id)
      ElMessage.success('删除成功')
      loadData()
    }).catch(() => {})
}

function handleBatchDelete() {
  ElMessageBox.confirm(`确定删除选中的 ${selections.value.length} 份健康档案吗？`, '批量删除', { type: 'warning' })
    .then(async () => {
      await Promise.all(selections.value.map(u => deleteUser(u.id)))
      ElMessage.success('批量删除成功')
      loadData()
    }).catch(() => {})
}

onMounted(loadData)
</script>

<style scoped>
.users-page { min-width: 0; }
.page-card { border-radius: 16px; border: none; }
.card-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
.header-actions { display: flex; gap: 12px; flex-wrap: wrap; }
.table-scroll { width: 100%; overflow-x: auto; }
.table-scroll :deep(.el-table) { min-width: 1100px; }
.table-footer { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-top: 16px; }
.table-footer :deep(.el-pagination) { max-width: 100%; flex-wrap: wrap; row-gap: 8px; }

@media screen and (max-width: 900px) {
  .header-actions { width: 100%; }
}
</style>
