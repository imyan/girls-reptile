const state = {
    running: false,
    timeout: 10,
    diffDirectory: true,
    count:{
      wait:0,
      success:0,
      error:0,
    }
}

const mutations = {
    STOP (state) {
      state.running = false
    },
    RUN (state) {
      state.running = true
    },
    TIMEOUT(state, param){
        state.timeout = param
    },
    DIFF_DIR(state, param){
        state.diffDirectory = param
    },
    COUNT(state, key='wait', num=1){
      state.count[key] += num;
    },
    COUNT_RESET(state){
      state.count = {
        wait:0,
        success:0,
        error:0,
      }
    }
}

const actions = {
    
  }

export default {
    state,
    mutations,
    actions
  }