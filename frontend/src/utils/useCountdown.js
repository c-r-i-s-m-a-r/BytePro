import { onBeforeUnmount, ref } from 'vue';

/**
 * Cuenta regresiva reactiva para penalizaciones de inicio de sesión.
 * Expone el total de segundos restantes y se detiene automáticamente al llegar a cero.
 */
export function useCountdown() {
  const segundosRestantes = ref(0);
  let timer = null;

  function detener() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function iniciar(segundos) {
    detener();
    const total = Math.max(0, Math.ceil(Number(segundos) || 0));
    segundosRestantes.value = total;
    if (total <= 0) return;

    timer = setInterval(() => {
      segundosRestantes.value -= 1;
      if (segundosRestantes.value <= 0) {
        segundosRestantes.value = 0;
        detener();
      }
    }, 1000);
  }

  onBeforeUnmount(detener);

  return { segundosRestantes, iniciar, detener };
}
