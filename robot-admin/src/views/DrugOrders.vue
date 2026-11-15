<template>
  <div class="drug-orders-page">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>药品订单</span>
          <div class="header-actions">
            <el-input v-model="searchKey" placeholder="搜索订单号/居民姓名/药品" clearable style="width: 240px" prefix-icon="Search" />
            <el-select v-model="filterStatus" placeholder="订单状态" clearable style="width: 140px">
              <el-option v-for="s in STATUS" :key="s" :label="s" :value="s" />
            </el-select>
            <el-button @click="loadData"><el-icon><Refresh /></el-icon> 刷新</el-button>
          </div>
        </div>
      </template>

      <div class="summary-row">
        <div class="summary-item"><span class="summary-label">订单总数</span><span class="summary-val">{{ tableData.length }}</span></div>
        <div class="summary-item"><span class="summary-label">待发货</span><span class="summary-val warn">{{ countBy('待发货') }}</span></div>
        <div class="summary-item"><span class="summary-label">已发货</span><span class="summary-val info">{{ countBy('已发货') }}</span></div>
        <div class="summary-item"><span class="summary-label">订单金额</span><span class="summary-val">{{ totalAmount.toFixed(2) }}</span></div>
      </div>

      <div class="table-scroll">
        <el-table :data="pagedData" stripe border v-loading="loading">
        <el-table-column prop="orderNo" label="订单号" width="150" />
        <el-table-column prop="userName" label="居民" width="110" />
        <el-table-column label="药品明细" min-width="280">
          <template #default="{ row }">
            <div class="order-item" v-for="(it, i) in row.items" :key="i">
              <span class="order-item-name">{{ it.name }}</span>
              <span class="order-item-spec">{{ it.spec }} × {{ it.qty }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="110">
          <template #default="{ row }">¥{{ Number(row.totalAmount).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="createdAt" label="下单时间" width="170" />
        <el-table-column label="状态" width="150">
          <template #default="{ row }">
            <el-select :model-value="row.status" size="small" @change="changeStatus(row, $event)">
              <el-option v-for="s in STATUS" :key="s" :label="s" :value="s" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewDetail(row)">详情</el-button>
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

    <el-dialog v-model="detailVisible" title="订单详情" width="560px">
      <el-descriptions v-if="detailRow" :column="1" border>
        <el-descriptions-item label="订单号">{{ detailRow.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="居民">{{ detailRow.userName }}</el-descriptions-item>
        <el-descriptions-item label="下单时间">{{ detailRow.createdAt }}</el-descriptions-item>
        <el-descriptions-item label="订单状态">
          <el-tag :type="statusType(detailRow.status)" size="small">{{ detailRow.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="药品明细">
          <div class="detail-item" v-for="(it, i) in detailRow.items" :key="i">
            <div class="detail-cover" :style="{ background: coverMeta(it.category).bg, color: coverMeta(it.category).color }">
              {{ coverMeta(it.category).icon }}
            </div>
            <span class="detail-name">{{ it.name }}</span>
            <span class="detail-spec">{{ it.spec }}</span>
            <span class="detail-qty">× {{ it.qty }}</span>
            <span class="detail-price">¥{{ (Number(it.price) * Number(it.qty)).toFixed(2) }}</span>
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="订单金额">¥{{ Number(detailRow.totalAmount).toFixed(2) }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getDrugOrders, updateDrugOrder } from '../utils/api'

const STATUS = ['待发货', '已发货', '已完成', '已取消']
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
const filterStatus = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const detailVisible = ref(false)
const detailRow = ref(null)

const filteredData = computed(() => {
  let list = tableData.value
  if (filterStatus.value) list = list.filter(o => o.status === filterStatus.value)
  const key = searchKey.value.trim().toLowerCase()
  if (key) {
    list = list.filter(o =>
      String(o.orderNo).toLowerCase().includes(key) ||
      String(o.userName).toLowerCase().includes(key) ||
      (o.items || []).some(it => String(it.name).toLowerCase().includes(key))
    )
  }
  return list
})

const pagedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredData.value.slice(start, start + pageSize.value)
})

const totalAmount = computed(() => tableData.value.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0))
const countBy = (status) => tableData.value.filter(o => o.status === status).length

function statusType(status) {
  return { '待发货': 'warning', '已发货': 'primary', '已完成': 'success', '已取消': 'info' }[status] || 'info'
}

async function loadData() {
  loading.value = true
  try { tableData.value = await getDrugOrders() }
  finally { loading.value = false }
}

async function changeStatus(row, status) {
  try {
    await updateDrugOrder(row.id, { status })
    row.status = status
    ElMessage.success(`订单 ${row.orderNo} 状态已更新为「${status}」`)
  } catch {
    ElMessage.error('状态更新失败')
  }
}

function viewDetail(row) {
  detailRow.value = row
  detailVisible.value = true
}

onMounted(loadData)
</script>

<style scoped>
.drug-orders-page { min-width: 0; }
.card-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
.header-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.table-scroll { width: 100%; overflow-x: auto; }
.table-scroll :deep(.el-table) { min-width: 1060px; }
.summary-row { display: flex; gap: 28px; padding: 4px 4px 18px; flex-wrap: wrap; }
.summary-item { display: flex; flex-direction: column; gap: 4px; }
.summary-label { font-size: 12px; color: #8E9AAB; }
.summary-val { font-size: 20px; font-weight: 700; color: #0B3B48; }
.summary-val.warn { color: #E6A23C; }
.summary-val.info { color: #2D9CDB; }
.order-item { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 8px; font-size: 13px; line-height: 1.7; }
.order-item-name { color: #24414A; white-space: nowrap; }
.order-item-spec { color: #8E9AAB; }
.table-footer { display: flex; justify-content: flex-end; margin-top: 16px; }
.table-footer :deep(.el-pagination) { max-width: 100%; flex-wrap: wrap; row-gap: 8px; }
.detail-item { display: flex; align-items: center; gap: 10px; padding: 4px 0; }
.detail-cover {
  width: 32px; height: 32px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center; font-size: 16px;
}
.detail-name { flex: 1; }
.detail-spec { color: #8E9AAB; font-size: 12px; }
.detail-qty { color: #5A6B75; font-size: 12px; }
.detail-price { color: #EB5757; font-size: 13px; }

@media screen and (max-width: 900px) {
  .header-actions { width: 100%; }
}
</style>
