<template>
    <div class="container" :style="{height:height+'px'}">
        <div class="title-bar">
            <div class="title-menu">
                <a href="javascript:void(0)" style="color:#515a6e">PicGather</a>
            </div>
            <div class="handle-bar" v-if="os === 'win32'"> 
                <Icon type="md-remove" :size='16' color='#ff9900' @click="onTitleMenuClick('minsize')"/>
                <Icon type="md-close-circle" :size='16' color='#ed4014' @click="onTitleMenuClick('quit')"/>
            </div>
        </div>
        <div id="main">
            <div style="margin-top:20px">
                <Form ref="formInline" inline :label-width="80">
                    <FormItem label='采集源'>
                        <Select :disabled="loading" v-model="config.siteIndex" style="width:200px" @on-change="originSourceChange">
                            <Option :value="index" :key="index" v-for="(item,index) in originSource">{{ item.name }}</Option>
                        </Select>
                    </FormItem>
                    <FormItem label='图片分类' v-if="originSource.length>0">
                        <Select :disabled="loading" v-model="config.tagIndex" style="width:200px" @on-change="saveConfig">
                            <Option :value="index" :key="index" v-for="(item,index) in originSource[config.siteIndex].tags">{{ item.name }}</Option>
                        </Select>
                    </FormItem>
                    <FormItem label='采集延迟(ms)'>
                        <Slider style="width:200px;" :disabled="loading" @on-change="saveConfig" v-model="config.timeout"
                            :min='10' :max='2000' :step='10' show-tip='hover' :tip-format='(value)=>{return `${value} ms`}'></Slider>
                    </FormItem>
                    <br>
                    <FormItem label='保存目录'>
                        <template>
                            <Input :value="config.saveDir" :disabled="loading" @on-search="selectSaveDir" style="width:300px" search enter-button placeholder="请选择保存目录" readonly />
                        </template>
                    </FormItem>
                    <FormItem label='区分目录'>
                        <template>
                            <i-switch :disabled="loading" @on-change="saveConfig" size="large" v-model='config.diffDirectory'>
                                <span slot="open">开启</span>
                                <span slot="close">关闭</span>
                            </i-switch>
                            <Button v-if="!loading" @click="getData" type="success" style="margin-left:10px"><Icon type="md-cloud-download" /> 立即进行自动采集</Button>
                            <Button v-else @click="stopRunning" type="error" style="margin-left:10px"><Icon type="md-close-circle" /> 立即停止采集</Button>
                            <Button @click="settingRS('show')" type="primary" style="margin-left:10px"><Icon type="md-cog" /> 设置采集源</Button>
                            <Button @click="getOriginSource(true)" style="margin-left:10px"><Icon type="md-cog" /> 同步采集源</Button>
                        </template>
                    </FormItem>
                </Form>
            </div>
            <Divider />
            <div>
                <div v-if="!loading && (!reptile.data || reptile.data.length==0) " style="width:100%;text-align:center">
                    <img src="../assets/ready.png" width="100px">
                    <p class="mt10">准备就绪，点击「立即进行自动采集」开始工作 😊</p>
                </div>
                <div v-else-if="loading && (!reptile.data || reptile.data.length==0) " style="width:100%;text-align:center">
                    <Icon class="ivu-load-loop" type="md-refresh" :size='100'/>
                    <p class="mt10">页面分析中，稍等片刻就可以看到工作进度 🤔</p>
                </div> 
                <div v-else id="records">
                    <template v-for="(item,index) in reptile.data" >
                        <Alert show-icon v-if="item.status==0">「等待数据分析」{{item.name}}</Alert>
                        <Alert show-icon type="success" v-else-if="item.status==1">「已加入采集队列」{{item.name}}</Alert>
                        <Alert show-icon type="warning" v-else-if="item.status==2">「采集异常」{{item.name}}</Alert>
                    </template>
                </div>
            </div>
        </div>
        <div id="status">
            <Row>
                <Col span='8'>
                    <div class="tc"><span class="dot"></span> 队列待采集数：{{countWait}}</div>
                </Col>
                <Col span='8'>
                    <div class='tc'><span class="dot success"></span> 已完成采集数：{{countSuccess}}</div>
                </Col>
                <Col span='8'>
                    <div class="tc"><span class="dot error"></span> 采集异常数：{{countError}}</div>
                </Col>
            </Row>
        </div>
        <div id="footer">
            <Row>
                <Col span='3'>
                    <div class="cur" @click="onTitleMenuClick('checkUpdate')"><Icon type="md-cloud-upload" /> 检查更新</div>
                </Col>
                <Col span='3'>
                    <div class="cur" @click="onTitleMenuClick('restart')"><Icon type="md-redo" /> 重新启动</div>
                </Col>
                <Col span='3'>
                    <div class="cur" @click="onTitleMenuClick('bug')"><Icon type="md-bug" /> 提交BUG</div>
                </Col>
                <Col span='3'>
                    <div class="cur" @click="onTitleMenuClick('idea')"><Icon type="ios-bulb" /> 提交想法</div>
                </Col>
                <Col span='3'>
                    <div class="cur" @click="onTitleMenuClick('support')"><Icon type="md-color-palette" /> 支持我们</div>
                </Col>
                <Col span='5'>
                    <div class="cur" @click="onTitleMenuClick('about')"><Icon type="md-alert" /> 关于软件 | 当前版本：{{version}}</div>
                </Col>
                <Col span='4'>
                    <div class="cur" @click="onTitleMenuClick('node')"><Icon type="md-flame" :style="`color:${config.node==1 ? '#19be6b':'#2d8cf0'}`"/> {{config.node==1 ? '国内':'国外'}}节点（点击切换）</div>
                </Col>
            </Row>
        </div>
        <Modal title="关于我们" v-model="showAbout">
            <p class="fs14">软件名称：PicGather</p>
            <p class="fs14">项目Github主页：<a @click="openUrl('https://github.com/Licoy/pic-gather')">https://github.com/Licoy/pic-gather</a></p>
            <p class="fs14">项目Gitee主页：<a @click="openUrl('https://gitee.com/licoy/pic-gather')">https://gitee.com/licoy/pic-gather</a></p>
            <p class="fs14">使用声明：此项目仅供学习交流使用，请勿使用于商业及非法用途，具体条款请参见于项目主页。</p>
        </Modal>
        <Modal title="采集源设置" v-model="setting.show" width="700px" :mask-closable='false' :closable='false'>
            <p style="font-size:12px">官方采集源：<a @click="openUrl('https://raw.githubusercontent.com/Licoy/pic-gather/master/reptile-source.json')"
                >https://raw.githubusercontent.com/Licoy/pic-gather/master/reptile-source.json</a></p>
            <br>
            <p style="font-size:12px">国内采集源：<a @click="openUrl('https://gitee.com/licoy/pic-gather/raw/master/reptile-source.json')"
                >https://gitee.com/licoy/pic-gather/raw/master/reptile-source.json</a></p>
            <br>
            <p style="font-size:12px">采集源规则：<a @click="openUrl('https://github.com/Licoy/pic-gather/wiki/reptile-source-rules')"
            >https://github.com/Licoy/pic-gather/wiki/reptile-source-rules</a></p>
            <br>
            <p style="font-size:12px">支持版本号：{{$reptileVersion}}（向下兼容）</p>
            <Divider />
            <Form :label-width='100'>
                <FormItem label='采集源地址：'>
                    <template>
                        <Input v-model="setting.tempRsUrl" :disabled="loading" placeholder="请输入采集源地址" />
                    </template>
                </FormItem>
            </Form>
            <div slot="footer" style="text-align:right">
                <Button @click="settingRS('close')">取消</Button>
                <Button type="primary" @click="settingRS('save')">确认更新</Button>
            </div>
        </Modal>
    </div>
</template>
<script>
import {remote,shell, os} from 'electron';
import getsMixins from '@/mixins/gets'
const {ipcRenderer} = require('electron');
import {version} from '../../../package.json';
export default {
    computed:{
        runningx() {
            return this.$store.state.Collect.running;
        },
        countWait(){
            return this.$store.state.Collect.count.wait;
        },
        countSuccess(){
            return this.$store.state.Collect.count.success;
        },
        countError(){
            return this.$store.state.Collect.count.error;
        }
    },
    watch: {
        runningx(newData, oldData) {
            this.loading = newData
        },
    },
    mixins:[getsMixins],
    async created(){
        this.version = version
        this.os = process.platform
        this.$store.commit('STOP')
        this.$store.commit('COUNT_RESET')
        this.config = this.$db.get('config').value()
        this.saveConfig(true)
        await this.getOriginSource(false)
        ipcRenderer.on('download-success', (event, arg) => {
            this.reptile.data[arg.index].status = 1;
        })
        ipcRenderer.on('download-error', (event, arg) => {
            this.reptile.data[arg.index].status = 2;
        })
        ipcRenderer.on('download-list', (event, arg) => {
            this.reptile.data = arg.data;
        })
        ipcRenderer.on('download-current', (event, arg) => {
            this.reptile.msgCurrent = arg.msg;
        })
        ipcRenderer.on('sys-check-update', (event, arg) => {
            this.checkUpdate(true)
        })
        ipcRenderer.on('img-success', (event, arg) => {
            this.$store.commit('COUNT','success');
        })
        ipcRenderer.on('img-error', (event, arg) => {
            this.$store.commit('COUNT','error');
        })
        this.checkUpdate(false)
        this.height = window.innerHeight;
        window.onresize = ()=>{
            this.height = window.innerHeight;
        }
    },
    data(){
        return {
            height:750,
            version:'1.0.0',
            model:'image',
            os:null,
            loading:false,
            showAbout:false,
            originSource:[],
            reptile:{
                data:[],
                msgCurrent:'空闲中'
            },
            config:null,
            setting:{
                tempRsUrl:null,
                show:false
            }
        }
    },
    methods:{
        async getOriginSource(refresh=false){
            if(!this.$db.has('origins').value() || refresh===true){
                let load = this.$Message.loading({
                    content: '采集源站资源同步中...',
                    duration: 0
                });
                try {
                    let res = await this.$http.get(this.config.rsUrl);
                    let rs = []
                    res.data.forEach(element => {
                        if(element.supportReptileVersion <= this.$reptileVersion){
                            rs.push(element)
                        }
                    });
                    this.originSource = rs
                    this.config.siteIndex = 0
                    this.config.tagIndex = 0
                    this.saveConfig()
                    load()
                    this.$db.set('origins',rs).write()
                    this.$Message.success("采集源同步成功")
                } catch (error) {
                    load()
                    console.error(error)
                    this.$Modal.confirm({
                        title: '提示',
                        content: '<p>采集源站资源加载失败，是否进行重新加载？</p><br><p>提示：如果您多次加载失败，请到Github项目主页提交issue。</p>',
                        onOk: () => {
                            this.getOriginSource(true)
                        }
                    });
                }
            }else{
                this.originSource = this.$db.get('origins').value()
            }
        },
        originSourceChange(val){
            this.config.tagIndex = 0
            this.saveConfig()
        },
        selectSaveDir(){
            const dialog = remote.dialog
            dialog.showOpenDialog({ properties: ['openDirectory'] }, (filename) => {
                if (filename&&filename.length === 1) {
                    this.config.saveDir = filename[0]
                    this.saveConfig()
                    this.$Modal.confirm({
                        title: '提示',
                        content: '<p>更改下载目录需要重启后生效，是否立即重启？</p>',
                        onOk: () => {
                            remote.app.relaunch()
                            remote.app.quit()
                        }
                    });
                }
            })
        },
        openSaveDir(){
            if(this.config.saveDir==''){
                this.$notification.error({
                    message:'打开目录失败',
                    description: '暂未配置选择图片保存目录，无法进行快捷打开目录，请先配置选择之后再进行操作！'
                });
                return
            }
        },
        getData(){
            this.$store.commit('RUN');
            this.reptile.data = []
            try{
                this.startReptile(this.originSource[this.config.siteIndex], this.config.tagIndex, this)
            }catch(e){
                this.$store.commit('STOP');
                this.$Message.error("采集出错")
            }
        },
        stopRunning(){
            this.$store.commit('STOP');
        },
        saveConfig(){
            this.$db.set('config',this.config).write()
            ipcRenderer.send('config-update', {})
            ipcRenderer.send('download-diff-dir-change', this.config.diffDirectory)
            this.$store.commit('TIMEOUT', this.config.timeout);
            this.$store.commit('DIFF_DIR', this.config.diffDirectory);
        },
        async checkUpdate(showLoading=true){
            const compareVersion2Update = (current, latest) => {
                const currentVersion = current.split('.').map(item => parseInt(item))
                const latestVersion = latest.split('.').map(item => parseInt(item))
                let flag = false
                for (let i = 0; i < 3; i++) {
                    if (currentVersion[i] < latestVersion[i]) {
                    flag = true
                    }
                }
                return flag
            }
            let load = () => {}
            if(showLoading){
                 load = this.$Message.loading({
                    content: '检查更新中',
                    duration: 0
                });
            }
            try {
                let updateUrl = 'https://gitee.com/api/v5/repos/licoy/pic-gather/releases/latest'
                if(this.config.node==2){
                    updateUrl = 'https://api.github.com/repos/Licoy/pic-gather/releases/latest'
                }
                let res = await this.$http.get(updateUrl)
                if(compareVersion2Update('v'+this.version,res.data.tag_name)){
                    load()
                    this.$Modal.confirm({
                        title: '提示',
                        content: '<p>检测到有新的版本'+res.data.tag_name+'，是否立即前往更新？</p>',
                        onOk: () => {
                            this.openNodeUrl('/releases')
                        }
                    });
                }else{
                    load()
                    if(showLoading){
                        this.$Message.success("当前已是最新版本！");
                    }
                }
            } catch (error) {
                load()
                if(showLoading){
                    this.$Message.error("获取版本信息失败");
                }
            }
        },
        onTitleMenuClick(name){
            if(name=='checkUpdate'){
                this.checkUpdate(true)
            }else if(name=='restart'){
                this.$Modal.confirm({
                    title: '提示',
                    content: '<p>是否确认重启？</p>',
                    onOk: () => {
                        remote.app.relaunch()
                        remote.app.quit()
                    }
                });
            }else if(name=='quit'){
                this.$Modal.confirm({
                    title: '提示',
                    content: '<p>是否确认退出？</p>',
                    onOk: () => {
                        remote.app.quit()
                    }
                });
            }else if(name=='about'){
                this.showAbout = true
            }else if(name=='minsize'){
                ipcRenderer.send('min', {})
            }else if(name=='bug'){
                let title = `[ ${version} ] - bug反馈`
                this.openUrl('https://github.com/Licoy/pic-gather/issues/new?assignees=&labels=bug&template=bug.md&title='+title)
            }else if(name=='idea'){
                let title = `[ ${version} ] - 想法`
                this.openUrl('https://github.com/Licoy/pic-gather/issues/new?assignees=&labels=需求&template=demand.md&title='+title)
            }else if(name=='support'){
                this.openNodeUrl('#支持我们')
            }else if(name=='github'){
                this.openNodeUrl('')
            }else if(name=='node'){
                this.config.node = this.config.node==1 ? 2 : 1;
                this.saveConfig()
            }
        },
        openUrl(url){
            shell.openExternal(url)
        },
        openNodeUrl(path){
            let url = 'https://gitee.com/licoy/pic-gather'
            if(this.config.node==2){
                url = 'https://github.com/Licoy/pic-gather'
            }
            this.openUrl(url + path)
        },
        settingRS(mode){
            if(mode=='show'){
                this.setting = {
                    tempRsUrl: this.config.rsUrl,
                    show: true
                }
            }else if(mode=='close'){
                this.setting.show = false
            }else{
                this.config.rsUrl = this.setting.tempRsUrl
                this.saveConfig()
                this.setting.show = false
                this.getOriginSource(true)
            }
        }
    }
}
</script>
<style lang="scss">
    .container{
        background-color: #f7f8fa;
    }
    #main{
        padding:10px
    }
    .tc{
        text-align: center;
    }
    .title-bar{
        -webkit-app-region: drag;
        text-align: center;
        height: 10px;
        padding:5px 0px 10px 0px;
        font-size: 14px;
    }
    .title-menu{
        cursor: pointer;
    }
    .fs14{
        font-size: 14px;
    }
    .handle-bar{
        -webkit-app-region: no-drag;
        position: fixed;
        top:2px;
        right:10px;
    }
    .mt10{
        margin-top:10px;
    }
    #records{
        height: 435px;
        overflow:scroll
    }
    #footer,#status{
        $height:40px;
        position: fixed;
        bottom: 0;
        width: 100%;
        height: $height;
        background-color: #17233d;
        color:#f8f8f9;
        font-size: 14px;
        line-height: $height;
        padding:0 10px;
        &#status{
           bottom: 40px; 
           background-color: #17233d;
           .dot{
               display: inline-block;
               $wh:10px;
               width: $wh;
               height: $wh;
               border-radius: $wh / 2;
               background-color:#ff9900;
               margin-right: 5px;
               &.success{
                   background-color:#19be6b;
               }
               &.error{
                   background-color:#ed4014;
               }
           }
           border-bottom:1px solid #808695;
        }
    }
    .cur{
        cursor: pointer;
        transition: all .2s;
        &:hover{
            color:#c5c8ce;
        }
    }
</style>