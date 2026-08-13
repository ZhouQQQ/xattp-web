import { useUserStore } from '@/stores/user.store';

const hidden = ref(false);
let clickCount = 0;
let clickTimer: ReturnType<typeof setTimeout> | null = null;

export function useWatermark() {
  const userStore = useUserStore();
  let container: HTMLDivElement | null = null;
  let observer: MutationObserver | null = null;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const width = 260;
  const height = 140;
  canvas.width = width;
  canvas.height = height;

  function draw(text: string) {
    ctx.clearRect(0, 0, width, height);
    ctx.font = 'bold 18px "Microsoft YaHei", "PingFang SC", sans-serif';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate((-22 * Math.PI) / 180);
    ctx.fillText(text, 0, 0);
    ctx.restore();

    return canvas.toDataURL('image/png');
  }

  function create() {
    if (hidden.value) return;
    const { nick, mobile } = userStore.userInfo;
    if (!nick || !mobile) return;

    const text = `${nick} ${String(mobile).slice(-4)}`;
    const bgImage = draw(text);

    remove();

    container = document.createElement('div');
    container.setAttribute('data-watermark', 'true');
    Object.assign(container.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: '99999',
      backgroundImage: `url(${bgImage})`,
      backgroundRepeat: 'repeat',
    });

    document.body.appendChild(container);

    observer = new MutationObserver((mutations) => {
      if (!container) return;
      const removed = mutations.some((m) =>
        Array.from(m.removedNodes).includes(container!),
      );
      if (removed && document.body && container) {
        document.body.appendChild(container);
      }
    });

    observer.observe(document.body, { childList: true });
  }

  function remove() {
    observer?.disconnect();
    observer = null;
    if (container?.parentNode) {
      container.parentNode.removeChild(container);
    }
    container = null;
  }

  watch(
    () => [userStore.userInfo.nick, userStore.userInfo.mobile, hidden.value],
    ([nick, mobile]) => {
      if (nick && mobile && !hidden.value) {
        create();
      } else {
        remove();
      }
    },
    { immediate: true },
  );

  onUnmounted(remove);
}

export function handleNameClick() {
  clickCount++;
  if (clickTimer) clearTimeout(clickTimer);
  clickTimer = setTimeout(() => {
    clickCount = 0;
  }, 3000);

  if (clickCount >= 5) {
    clickCount = 0;
    if (clickTimer) clearTimeout(clickTimer);
    hidden.value = !hidden.value;
  }
}