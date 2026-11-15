<template>
  <div class="page-wrap">
    <el-card shadow="never" class="page-card">
      <template #header>
        <div class="card-head">
          <div>
            <h3>健康宣教横幅</h3>
            <p>管理居民端首页的宣教横幅，支持图片切换与跳转配置</p>
          </div>
          <el-button type="primary" @click="openDialog()"><el-icon><Plus /></el-icon> 新增横幅</el-button>
        </div>
      </template>

      <div class="table-scroll">
        <el-table :data="tableData" stripe v-loading="loading" row-key="id">
        <el-table-column label="预览" width="140">
          <template #default="{ row }">
            <el-image :src="toImg(row.image)" fit="cover" class="thumb" :preview-src-list="[toImg(row.image)]" />
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="160" />
        <el-table-column prop="desc" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="linkType" label="跳转类型" width="110">
          <template #default="{ row }">
            <el-tag size="small">{{ linkLabels[row.linkType] || row.linkType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="70" />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">{{ row.status === 'active' ? '启用' : '停用' }}</el-tag>
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

    <el-dialog v-model="visible" :title="isEdit ? '编辑宣教横幅' : '新增宣教横幅'" width="640px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="标题" prop="title"><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="描述" prop="desc"><el-input v-model="form.desc" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="轮播图片" prop="image">
          <div class="img-picker">
            <div v-for="img in BANNER_IMAGES" :key="img" class="img-item" :class="{ sel: form.image === '/static' + img || form.image === img }" @click="form.image = '/static' + img">
              <el-image :src="img" fit="cover" />
            </div>
          </div>
        </el-form-item>
        <el-form-item label="跳转类型">
          <el-select v-model="form.linkType">
            <el-option label="科普文章详情" value="knowledge" />
            <el-option label="健康打卡" value="checkin" />
            <el-option label="健康积分榜" value="ranking" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联ID" v-if="form.linkType === 'knowledge'">
          <el-input-number v-model="form.linkId" :min="1" />
        </el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.sort" :min="1" /></el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio value="active">启用</el-radio>
            <el-radio value="inactive">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="宣教横幅详情" width="520px">
      <el-descriptions :column="1" border v-if="detail">
        <el-descriptions-item label="预览"><el-image :src="toImg(detail.image)" style="width:200px;height:120px;border-radius:8px" fit="cover" /></el-descriptions-item>
        <el-descriptions-item label="标题">{{ detail.title }}</el-descriptions-item>
        <el-descriptions-item label="描述">{{ detail.desc }}</el-descriptions-item>
        <el-descriptions-item label="跳转">{{ linkLabels[detail.linkType] }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ detail.status }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getBanners, createBanner, updateBanner, deleteBanner, BANNER_IMAGES } from '../utils/api'

const linkLabels = { knowledge: '科普文章', checkin: '健康打卡', ranking: '健康积分榜' }
const loading = ref(false)
const tableData = ref([])
const visible = ref(false)
const detailVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const detail = ref(null)
const formRef = ref(null)
const form = reactive({ id: null, title: '', desc: '', image: '/static/image/1.jpg', linkType: 'knowledge', linkId: 1, sort: 1, status: 'active' })
const rules = { title: [{ required: true, message: '请输入标题', trigger: 'blur' }], desc: [{ required: true, message: '请输入描述', trigger: 'blur' }] }

function toImg(path) {
  if (!path) return '/image/1.jpg'
  if (path.startsWith('/static/image/')) return path.replace('/static/image/', '/image/')
  if (path.startsWith('/image/')) return path
  return '/image/' + path
}

async function loadData() {
  loading.value = true
  try { tableData.value = (await getBanners()).sort((a, b) => (a.sort || 0) - (b.sort || 0)) }
  finally { loading.value = false }
}

function openDialog(row) {
  isEdit.value = !!row
  if (row) Object.assign(form, { ...row })
  else Object.assign(form, { id: null, title: '', desc: '', image: '/static/image/1.jpg', linkType: 'knowledge', linkId: 1, sort: tableData.value.length + 1, status: 'active' })
  visible.value = true
}

function viewDetail(row) { detail.value = row; detailVisible.value = true }

async function submit() {
  await formRef.value.validate()
  submitting.value = true
  try {
    if (isEdit.value) { await updateBanner(form.id, { ...form }); ElMessage.success('编辑成功，居民端将同步') }
    else { await createBanner({ ...form }); ElMessage.success('新增成功') }
    visible.value = false; loadData()
  } catch { ElMessage.error('操作失败') }
  finally { submitting.value = false }
}

function handleDelete(row) {
  ElMessageBox.confirm(`删除宣教横幅「${row.title}」？`, '确认', { type: 'warning' })
    .then(async () => { await deleteBanner(row.id); ElMessage.success('已删除'); loadData() }).catch(() => {})
}

onMounted(loadData)
</script>

<style scoped>
.page-card { border-radius: 16px; border: none; }
.card-head { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
.table-scroll { width: 100%; overflow-x: auto; }
.table-scroll :deep(.el-table) { min-width: 970px; }
.card-head h3 { margin: 0 0 4px; font-size: 18px; color: #0B3B48; }
.card-head p { margin: 0; font-size: 13px; color: #999; }
.thumb { width: 120px; height: 68px; border-radius: 8px; }
.img-picker { display: flex; flex-wrap: wrap; gap: 10px; }
.img-item { width: 80px; height: 50px; border-radius: 8px; overflow: hidden; cursor: pointer; border: 2px solid transparent; transition: all 0.2s; }
.img-item.sel { border-color: #12A8A0; transform: scale(1.05); }
.img-item .el-image { width: 100%; height: 100%; }
</style>
