// difficult_scripts：难念的经，bare_face：素颜
let lrcList = [difficult_scripts, bare_face];
let audioSrc = ['./assets/difficult_scripts.mp3', './assets/bare_face.mp3'];
let musicIndex = 0;
let playStatus = 'zanting';
let audio = new Audio(audioSrc[musicIndex]);

/**
 * 解析歌词字符串
 * 得到一个歌词对象的数组
 * 每个歌词对象：
 * {time:开始时间, words: 歌词内容}
 */
function parseLrc() {
  let lines = lrcList[musicIndex].split('\n');
  let result = []; // 歌词对象数组
  for (let i = 0; i < lines.length; i++) {
    let str = lines[i];
    let parts = str.split(']');
    let timeStr = parts[0].substring(1);

    let obj = {
      time: parseTime(timeStr),
      words: parts[1],
    };
    result.push(obj);
  }
  return result;
}

/**
 * 将一个时间字符串解析为数字（秒）
 * @param {String} timeStr 时间字符串
 * @returns
 */
function parseTime(timeStr) {
  let times = timeStr.split(':');
  return +times[0] * 60 + +times[1];
}

// 时间，歌词数组
let lrcData = parseLrc();
// 获取需要的 dom
let doms = {
  audio,
  ul: document.querySelector('.container ul'),
  container: document.querySelector('.container'),
  pre: document.querySelector('.pre'),
  next: document.querySelector('.next'),
  play: document.querySelector('.play'),
  progress: document.querySelector('.progress'),
  progressBar: document.querySelector('.progress-bar'),
  progressCircle: document.querySelector('.progress-circle'),
  progressBg: document.querySelector('.progress-bg'),
};
// 进度条宽度
const progerssWidth = doms.progress.clientWidth;
/**
 * 计算出，在当前播放器播放到第几秒的情况下
 * lrcData数组中，应该高亮显示的歌词下标
 * 如果没有任何一句歌词需要显示，则得到-1
 */
function findIndex() {
  // 播放器当前时间
  let curTime = doms.audio.currentTime;
  for (let i = 0; i < lrcData.length; i++) {
    if (curTime < lrcData[i].time) {
      return i - 1;
    }
  }
  // 找遍了都没找到（说明播放到最后一句）
  return lrcData.length - 1;
}

// 界面

/**
 * 创建歌词元素 li
 */
function createLrcElements() {
  let frag = document.createDocumentFragment(); // 文档片段
  for (let i = 0; i < lrcData.length; i++) {
    let li = document.createElement('li');
    li.textContent = lrcData[i].words;
    frag.appendChild(li); // 改动了 dom 树
  }
  doms.ul.appendChild(frag);
}
createLrcElements();

// 容器高度
let containerHeight = doms.container.clientHeight;
// 每个 li 的高度
let liHeight = doms.ul.children[0].clientHeight;
// 最大偏移量
let maxOffset = doms.ul.clientHeight - containerHeight;
// 末尾
function ending() {
  if (audio.currentTime === audio.duration) {
    audio.pause();
    doms.play.classList.remove('icon-zanting');
    doms.play.classList.add('icon-bofang');
    playStatus = 'zanting';
  }
}
/**
 * 设置 ul 元素的偏移量
 */
function setOffset() {
  let index = findIndex();
  let offset = liHeight * index + liHeight / 2 - containerHeight / 2;
  if (offset < 0) {
    offset = 0;
  }
  if (offset > maxOffset) {
    offset = maxOffset;
  }
  doms.ul.style.transform = `translateY(-${offset}px)`;
  const x = audio.currentTime / audio.duration * progerssWidth;
  progressPosition(x);
  // 去掉之前的 active 样式
  let li = doms.ul.querySelector('.active');
  if (li) {
    li.classList.remove('active');
  }

  li = doms.ul.children[index];
  if (li) {
    li.classList.add('active');
  }
  ending();
}
doms.audio.addEventListener('timeupdate', setOffset);


/**
 * 进度条
 */
// 进度条位置
const processX = doms.progress.getBoundingClientRect().x;
const mouseDownHandler = e => {
  doms.progress.addEventListener("mousemove", mouseMoveHandler);
}

// 进度条位置
function progressPosition(x = 0) {
  doms.progressBar.style.setProperty('--play-width', `${x}px`);
  doms.progressCircle.style.setProperty('--play-width', `${x}px`);
}
/**
 * 设置时长
 * @params {Number} nowX 现在相对process位置
 *  
 */
let timer = null;
function audioTimeSet(nowX = 0) {
  let currentTime = 0;
  if (nowX) {
    currentTime = audio.duration * (nowX / progerssWidth);
  } else {
    currentTime = 0;
  }
  audio.currentTime = currentTime;
}

// 进度条调整
const handleProcess = (clientX = 0) => {
 // 拖拽进度位置
 let x = clientX - processX;
 if (x > progerssWidth) {
   x = progerssWidth;
 }
 if (x <= 0) {
   x = 0;
 }
 audioTimeSet(x);
 progressPosition(x);
 ending();
}
const mouseMoveHandler = e => {
  audio.pause();
  clearTimeout(timer);
  handleProcess(e.clientX);
  timer = setTimeout(() => {
    if (playStatus === 'bofang') {
      audio.play();
    }
  }, 300)
};

window.addEventListener('mouseup', () => {
  doms.progress.removeEventListener("mousemove", mouseMoveHandler);
});
doms.progressCircle.addEventListener('mousedown', mouseDownHandler);

const progressBgClick = e => {
  handleProcess(e.clientX);
}
// 进度条点击
doms.progressBg.addEventListener('click', progressBgClick);
doms.progressBar.addEventListener('click', progressBgClick);

/**
 * 
 * 按键设置
 */

// 重置样式
function reset() {
  doms.audio.removeEventListener('timeupdate', setOffset);
  // 进度条样式重置
  progressPosition(0);
  doms.ul.style.transform = `translateY(0px)`;
  doms.ul.innerHTML = null;
  // 去掉之前的 active 样式
  let li = doms.ul.querySelector('.active');
  if (li) {
    li.classList.remove('active');
  }
  audio.pause();
  audio = null;
}

function play() {
  // 去掉之前的 active 样式
  if (playStatus === 'bofang') {
    doms.play.classList.remove('icon-zanting');
    doms.play.classList.add('icon-bofang');
    playStatus = 'zanting';
    // 暂停
    audio.pause();
  } else {
    doms.play.classList.remove('icon-bofang');
    doms.play.classList.add('icon-zanting');
    playStatus = 'bofang';
    audio.play();
  }
}
// 初始化
function init(musicIndex) {
  if (musicIndex >= lrcList.length - 1) {
    musicIndex = lrcList.length - 1;
  } else {
    musicIndex = 0;
  }
  audio = new Audio(audioSrc[musicIndex]);
  doms.audio = audio;
  doms.audio.addEventListener('timeupdate', setOffset);
  lrcData = parseLrc();
  createLrcElements();
  playStatus = 'zanting';
  play();
}
// 下一首
function nextClcik() {
  reset();
  musicIndex++;
  init(musicIndex);
  doms.pre.disabled = false;
  doms.next.disabled = true;
}

function preClick() {
  reset();
  musicIndex--;
  init(musicIndex);
  doms.pre.disabled = true;
  doms.next.disabled = false;
}