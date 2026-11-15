<template>
  <div class="checkins-page">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>健康打卡记录</span>
          <el-input v-model="searchKey" placeholder="搜索居民/日期/科普文章" clearable style="width: 260px" prefix-icon="Search" />
        </div>
      </template>

      <div class="table-scroll">
        <el-table :data="pagedData" stripe border v-loading="loading" @selection-change="sel => selections = sel">
        <el-table-column type="selection" width="50" />
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="userName" label="居民" width="100" />
        <el-table-column prop="checkDate" label="打卡日期" width="110" />
        <el-table-column prop="recordTime" label="记录时间" width="90" />
        <el-table-column prop="bloodPressure" label="血压(mmHg)" width="115" />
        <el-table-column prop="bloodSugarText" label="血糖(mmol/L)" width="110" />
        <el-table-column prop="weightText" label="体重(kg)" width="90" />
        <el-table-column prop="steps" label="步数" width="75" />
        <el-table-column prop="points" label="积分" width="70" />
        <el-table-column prop="status" label="状态" width="85">
          <template #default="{ row }">
            <el-tag :type="row.status === 'completed' ? 'success' : 'warning'" size="small">
              {{ row.status === 'completed' ? '已完成' : '待随访' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="130" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewDetail(row)">详情</el-button>
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
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
        />
      </div>
    </el-card>

    <el-dialog v-model="detailVisible" title="健康打卡详情" width="520px">
      <el-descriptions :column="1" border v-if="detailRow">
        <el-descriptions-item label="居民">{{ detailRow.userName }}</el-descriptions-item>
        <el-descriptions-item label="关联科普">{{ detailRow.knowledgeTitle }}</el-descriptions-item>
        <el-descriptions-item label="打卡日期">{{ detailRow.checkDate }} {{ detailRow.recordTime || '' }}</el-descriptions-item>
        <el-descriptions-item label="血压">{{ detailRow.bloodPressure }} mmHg</el-descriptions-item>
        <el-descriptions-item label="血糖">{{ detailRow.bloodSugarText }} mmol/L</el-descriptions-item>
        <el-descriptions-item label="体重">{{ detailRow.weightText }} kg</el-descriptions-item>
        <el-descriptions-item label="步数">{{ detailRow.steps || '-' }} 步</el-descriptions-item>
        <el-descriptions-item label="健康积分">{{ detailRow.points }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ detailRow.status === 'completed' ? '已完成' : '待随访' }}</el-descriptions-item>
        <el-descriptions-item label="随访备注">{{ detailRow.note || '无' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCheckins, getUsers, getKnowledge, deleteCheckin } from '../utils/api'

const loading = ref(false)
const tableData = ref([])
const searchKey = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const selections = ref([])
const detailVisible = ref(false)
const detailRow = ref(null)

const filteredData = computed(() => {
  if (!searchKey.value) return tableData.value
  const key = searchKey.value.toLowerCase()
  return tableData.value.filter(c =>
    c.userName?.toLowerCase().includes(key) ||
    c.checkDate?.includes(key) ||
    c.knowledgeTitle?.toLowerCase().includes(key)
  )
})

const pagedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredData.value.slice(start, start + pageSize.value)
})

async function loadData() {
  loading.value = true
  try {
    const [checkins, users, knowledge] = await Promise.all([getCheckins(), getUsers(), getKnowledge()])
    const userMap = {}
    users.forEach(u => { userMap[u.id] = u.nickname })
    const knowledgeMap = {}
    knowledge.forEach(k => { knowledgeMap[k.id] = k.title })

    tableData.value = checkins.map(c => ({
      ...c,
      userName: userMap[c.userId] || '未知居民',
      knowledgeTitle: knowledgeMap[c.knowledgeId] || '未知文章',
      bloodPressure: `${c.systolic ?? '-'}/${c.diastolic ?? '-'}`,
      bloodSugarText: c.bloodSugar ?? '-',
      weightText: c.weight ?? '-'
    })).reverse()
  } finally {
    loading.value = false
  }
}

function viewDetail(row) {
  detailRow.value = row
  detailVisible.value = true
}

function handleDelete(row) {
  ElMessageBox.confirm('确定删除该条健康打卡记录吗？', '删除确认', { type: 'warning' })
    .then(async () => {
      await deleteCheckin(row.id)
      ElMessage.success('删除成功')
      loadData()
    }).catch(() => {})
}

function handleBatchDelete() {
  ElMessageBox.confirm(`确定删除选中的 ${selections.value.length} 条健康打卡记录吗？`, '批量删除', { type: 'warning' })
    .then(async () => {
      await Promise.all(selections.value.map(c => deleteCheckin(c.id)))
      ElMessage.success('批量删除成功')
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

.table-scroll { width: 100%; overflow-x: auto; }
.table-scroll :deep(.el-table) { min-width: 1085px; }

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 16px;
}
.table-footer :deep(.el-pagination) { max-width: 100%; flex-wrap: wrap; row-gap: 8px; }
</style>
