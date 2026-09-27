// src/feature/inicio/lib/modales/test/plantillas.js
// 🎯 Plantillas de Escucha Empática y Respaldo Clínico Instantáneo (0ms)
// Genera respuestas cálidas, humanas y comprensivas analizando la emoción y el texto libre.

/**
 * Genera una devolución empática en vivo según la emoción y el desahogo libre del paciente
 * @param {Object} datos - { emocionId, emocionTexto, desahogo, tiempo }
 * @param {string} [lang='es'] - Idioma ('es' o 'en')
 * @returns {string} Devolución empática
 */
export function generarDevolucionEmpatica(datos = {}, lang = 'es') {
  const esEn = lang === 'en';
  const textoLibre = (datos.desahogo || '').toLowerCase();
  const emocionId = datos.emocionId || 'triste';
  const tiempo = datos.tiempo || '';

  // 1. Análisis Heurístico de Temas Sensibles y Desahogo Libre
  if (textoLibre.includes('no se que') || textoLibre.includes('no sé qué') || textoLibre.includes('muchas cosas') || textoLibre.includes('mi vida') || textoLibre.includes('abrumad') || textoLibre.includes('perdido')) {
    return esEn
      ? `I hold what you are experiencing with deep compassion and respect. Feeling that life has presented you with so many burdens at once, until your path feels unclear, does not mean you have failed; it is the natural response of someone who has been carrying too much alone for too long.\n\nPlease remember that you are not lost and you do not need to resolve everything today. Together in session with Lic. Sofía Reynaga, we will gently untangle each burden step by step, soothing that overthinking and restoring your peace, direction, and clarity.`
      : `Abrazo con profundo respeto lo que estás experimentando. Sentir que la vida te ha puesto tantas pruebas juntas y que el camino se vuelve difuso no significa que hayas fallado; es la respuesta natural de un corazón que ha resistido en soledad durante demasiado tiempo.\n\nQuiero recordarte que no estás a la deriva ni tienes que resolver todo hoy. Juntas en sesión iremos ordenando cada una de esas situaciones paso a paso, ayudándote a calmar la mente y a recuperar el rumbo, la serenidad y la claridad que mereces.`;
  }

  if (textoLibre.includes('mascota') || textoLibre.includes('perr') || textoLibre.includes('gat') || textoLibre.includes('pet')) {
    return esEn
      ? `I honor and deeply validate this intimate grief. The passing of a beloved pet leaves a profound stillness in your home and in your heart, because their daily presence and unconditional loyalty touched every corner of your days.\n\nYou do not have to rush your healing or hide your tears over this loss. We are here to stand by your side with immense empathy, helping you navigate this journey and gently heal your heart at your own pace.`
      : `Reconozco y valido de corazón este duelo tan íntimo. La partida de un compañero animal deja un silencio enorme en el hogar y en el alma, porque su lealtad, su presencia diaria y su ternura incondicional marcaron cada rincón de tus días.\n\nNo tienes que apresurar tus tiempos ni esconder las lágrimas por haber perdido a tu mascota. Estamos aquí para acompañarte paso a paso con infinita empatía, ayudándote a sanar esta ausencia y a encontrar un nuevo sentido de calma en tu camino.`;
  }

  if (textoLibre.includes('perdi') || textoLibre.includes('perdí') || textoLibre.includes('fallec') || textoLibre.includes('muri') || textoLibre.includes('muert') || textoLibre.includes('loss') || textoLibre.includes('died') || textoLibre.includes('duelo')) {
    return esEn
      ? `I stand with your sorrow with the utmost gentleness and respect. Saying goodbye to someone you loved so dearly leaves a deep ache in the chest, especially when memories of their shared companionship return in everyday moments.\n\nAllow yourself to experience this grief without pressure to quickly recover after this loss. We are here to support you with boundless empathy, helping you process this departure and find peace once more.`
      : `Acompaño tu sentir con máxima delicadeza y respeto. Despedir a alguien que amaste tanto deja un vacío que duele en el pecho, sobre todo cuando los recuerdos cotidianos y los momentos compartidos tocan la memoria a cada instante.\n\nPermítete vivir este dolor sin presiones ni exigencias de recuperarte de golpe tras esta pérdida. Estamos aquí para sostener este proceso a tu lado con infinita empatía, ayudándote a sanar el dolor de la partida y a encontrar, a tu propio ritmo, serenidad en tu camino.`;
  }

  if (textoLibre.includes('pareja') || textoLibre.includes('ruptura') || textoLibre.includes('termin') || textoLibre.includes('infiel') || textoLibre.includes('breakup') || textoLibre.includes('divorce') || textoLibre.includes('separac')) {
    return esEn
      ? `I recognize how painful it is to experience the end of a meaningful bond. Navigating a relationship breakup shakes your deepest sense of emotional safety, bringing repetitive worry and deep uncertainty about the future.\n\nAs dark as this chapter may feel, this pain is not your permanent destination. With evidence-based tools, we will help you heal emotional wounds, rebuild confidence, and regain total serenity.`
      : `Sé lo doloroso que resulta ver transformarse un vínculo importante. Atravesar una separación o herida de pareja sacude nuestras certezas más profundas, despertando pensamientos repetitivos, temor a la soledad y una intensa incertidumbre sobre el futuro.\n\nPor difícil que parezca este momento, el dolor no durará para siempre. Con herramientas terapéuticas claras ordenaremos tus emociones y fortaleceremos tu autoestima, para que recuperes el control de tu vida y una profunda paz personal.`;
  }

  if (textoLibre.includes('trabajo') || textoLibre.includes('laboral') || textoLibre.includes('jefe') || textoLibre.includes('estudio') || textoLibre.includes('work') || textoLibre.includes('burnout') || textoLibre.includes('presion')) {
    return esEn
      ? `I value your honesty in recognizing this boundary. Chronic work burnout and non-stop pressure are never signs of weakness; they are your nervous system's urgent signal after giving far more than is sustainably possible.\n\nYour mental peace and vitality belong at the forefront. Together, we will build protective boundaries and restful routines so you can recharge your strength and enjoy life again.`
      : `Valoro tu sinceridad al reconocer este límite. La sobrecarga continua y el agotamiento laboral no son una señal de flaqueza, sino la voz de alerta de tu organismo al haber entregado más de lo humanamente sostenible.\n\nTu tranquilidad vale más que cualquier exigencia externa. Juntas aprenderemos a establecer límites protectores y desconectar la mente, recuperando la energía y la vitalidad que necesitas para volver a disfrutar de tus días.`;
  }

  // 2. Respuesta según el estado emocional seleccionado
  switch (emocionId) {
    case 'triste':
      return esEn
        ? `I recognize how heavy daily routines become when sadness sets in. Living with persistent sadness or discouragement makes even simple tasks feel overwhelming, as if carrying an invisible weight upon your shoulders.\n\nPlease know you never have to pretend you are fine or face this sadness alone. Together in therapy with Lic. Sofía Reynaga, we will take gentle steps to lift this heavy weight, transforming that discouragement into lasting relief, motivation, and well-being.`
        : `Sé lo desgastante que se vuelve la rutina cuando el desánimo se hace presente. Sentirte triste o sin energías hace que hasta el gesto más simple requiera un esfuerzo descomunal, como si llevaras un peso invisible sobre los hombros.\n\nQuiero que sepas que no tienes que fingir fortaleza ni quedarte a solas con este desánimo. Juntas en sesión iremos recuperando tu bienestar paso a paso, brindándote un espacio seguro donde ese desánimo se transforme en alivio, fortaleza y renovadas ganas de vivir.`;

    case 'agotado':
      return esEn
        ? `I honor the accumulated weariness you have been carrying. Reaching severe mental exhaustion is the natural consequence of shouldering endless pressures and quiet battles without a genuine pause.\n\nIt is completely valid to stop and allow yourself to receive dedicated care. Here you will find a sanctuary of calm and practical tools to silence the mental pressure, release the weight of exhaustion, and recharge your inner vitality.`
        : `Escucho con total respeto el cansancio que llevas acumulado. Llegar a un punto de agotamiento mental es la consecuencia de haber sostenido demasiadas exigencias, preocupaciones y batallas silenciosas sin darte un respiro genuino.\n\nEs completamente legítimo detenerte y pedir ayuda para aliviar este agotamiento mental tan pesado. Aquí encontrarás un refugio de verdadera calma y técnicas prácticas para desconectar, apagar el ruido constante y recargar tus energías con tranquilidad.`;

    case 'perdida':
      return esEn
        ? `I hold your grief tenderly in the face of such a meaningful absence. Experiencing the loss of someone or something vital alters your world, awakening echoes of treasured moments and irreplaceable companionship.\n\nYou do not have to force a smile or walk this path of loss alone. We are here to stand beside you with unconditional empathy, helping you heal the pain of losing someone so meaningful and gradually rediscover peace and comfort on your journey.`
        : `Abrazo tu dolor frente a esta ausencia tan significativa. Perder a alguien o algo vital en tu vida es un proceso doloroso que transforma por completo tu mundo, trayendo a la memoria el eco de los días compartidos y su compañía irremplazable.\n\nNo tienes que apresurarte ni guardar silencio sobre lo que sientes tras esta pérdida. Estamos aquí para sostener este proceso a tu lado con infinita empatía, ayudándote a sanar el dolor de haber perdido a alguien tan valioso y a encontrar, a tu propio ritmo, un nuevo sentido de calma y paz en tu camino.`;

    case 'sobrepensar':
      return esEn
        ? `I recognize how deeply tiring it is when your mind cannot find the pause button. Relentless overthinking and anxiety trigger an exhausting cycle of worry, where your thoughts constantly anticipate worst-case scenarios.\n\nPlease know with total clarity that there is a proven path to quiet this mental noise. With evidence-based cognitive tools, we will help you break free from repetitive thoughts and return clarity, control, and peace to your daily life.`
        : `Comprendo lo agotador que resulta cuando la mente no encuentra el botón de pausa. El sobrepensamiento continuo y la angustia generan un estado de alerta constante, donde la cabeza se llena de dudas y escenarios difíciles en bucle que no se apagan, impidiéndote descansar o disfrutar de tu presente.\n\nQuiero que tengas la certeza de que sí es posible ponerle un alto a este sobrepensamiento y calmar esa angustia. Con técnicas cognitivas claras aprenderás a frenar los pensamientos repetitivos, devolviéndole a tu mente el silencio, el control y la serenidad que tanto anhelas.`;

    default:
      return esEn
        ? `I hold immense appreciation for your courage in opening this space of honesty. Every emotion you experience deserves attentive listening, free from judgment, wrapped in compassionate therapeutic care.\n\nYou do not have to navigate this journey alone. Therapy offers the safe haven and practical guidance you need to find clarity, comfort, and lasting peace.`
        : `Valoro profundamente tu valentía al abrir este espacio de sinceridad. Cada una de tus vivencias y emociones merece una mirada atenta, sin juicios y con la más cálida contención terapéutica.\n\nNo tienes que afrontar esto a solas. La terapia te brindará el espacio de contención y las herramientas necesarias para transformar el malestar en bienestar y paz interior.`;
  }
}

/**
 * Ficha de Derivación final para la etapa 2
 */
export function obtenerPlantillaDerivacion(datos = {}, lang = 'es') {
  const esEn = lang === 'en';
  const nombre = datos.nombre?.trim() || (esEn ? 'Patient' : 'Paciente');
  const emocionTexto = datos.emocionTexto || (esEn ? 'Emotional distress' : 'Malestar emocional');

  return {
    tituloPerfil: esEn ? `Orientation Profile for ${nombre}` : `Perfil de Orientación para ${nombre}`,
    enfoqueRecomendado: esEn
      ? 'Integrative Cognitive Behavioral & Empathic Support'
      : 'Psicoterapia Cognitivo Conductual & Acompañamiento Empático',
    sintesis: esEn
      ? `The patient expresses feeling ${emocionTexto.toLowerCase()}, seeking an empathetic, confidential space to process their current challenges with Lic. Sofía Reynaga.`
      : `El/la paciente manifiesta sentirse ${emocionTexto.toLowerCase()}, buscando un espacio seguro, confidencial y sin juicios para abordar su situación junto a la Lic. Sofía Reynaga.`
  };
}

export default {
  generarDevolucionEmpatica,
  obtenerPlantillaDerivacion
};
