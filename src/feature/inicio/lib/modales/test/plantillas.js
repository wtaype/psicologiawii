// src/feature/inicio/lib/modales/test/plantillas.js
// 🎯 Plantillas de Orientación Clínica Profesionales (Fallback 0ms Instantáneo)
// Brinda orientación terapéutica inmediata y validada sin depender de red o API key.

export function obtenerPlantillaClinica(estado, lang = 'es') {
  const r = estado.respuestas;
  const motivo = r.motivoId || 'ansiedad';
  const nombre = r.nombrePaciente?.trim() || (lang === 'en' ? 'Client' : 'Paciente');
  const esEn = lang === 'en';

  const PLANTILLAS = {
    ansiedad: {
      es: {
        tituloPerfil: 'Perfil: Manejo de Ansiedad y Sobrecarga Emocional',
        enfoqueRecomendado: 'Psicoterapia Cognitivo Conductual (TCC) y Regulación Somática',
        resumenEmpatico: `Hola ${nombre}, tus respuestas reflejan que tu sistema nervioso ha estado funcionando en un nivel de alerta superior al que tu cuerpo puede sostener cómodamente. Es completamente natural sentirse agotado/a cuando los pensamientos se aceleran o el cuerpo somatiza la tensión. Lo más valioso es que no tienes que seguir sobrellevándolo a solas.`,
        puntosClave: [
          'Desactivación de pensamientos en bucle mediante reestructuración cognitiva.',
          'Entrenamiento en respiración diafragmática y técnicas somáticas para frenar la alerta física.',
          'Estrategias paso a paso para recuperar el descanso reparador y la paz mental en tu día a día.'
        ],
        mensajeEspecialista: 'La Lic. Sofía Reynaga (Colegiada C.Ps.P. 49425) te acompañará en un entorno confidencial para devolverte el control y la serenidad desde tu primera sesión.'
      },
      en: {
        tituloPerfil: 'Profile: Anxiety and Stress Management',
        enfoqueRecomendado: 'Cognitive Behavioral Therapy (CBT) & Somatic Regulation',
        resumenEmpatico: `Hello ${nombre}, your responses indicate that your nervous system has been operating on a higher state of alert than your body can comfortably sustain. It is completely natural to feel exhausted when thoughts loop or physical tension rises. Most importantly, you do not have to carry this alone.`,
        puntosClave: [
          'Deactivating thought loops through cognitive restructuring tools.',
          'Diaphragmatic breathing and grounding techniques to regulate physical anxiety.',
          'Step-by-step strategies to restore restful sleep and inner peace in your daily routine.'
        ],
        mensajeEspecialista: 'Lic. Sofía Reynaga (Licensed Psychologist C.Ps.P. 49425) will guide you in a confidential, warm environment to regain calm and control from your very first session.'
      }
    },

    pareja: {
      es: {
        tituloPerfil: 'Perfil: Terapia de Pareja y Reconstrucción del Vínculo',
        enfoqueRecomendado: 'Terapia Sistémica Familiar y Comunicación Asertiva',
        resumenEmpatico: `Hola ${nombre}, las crisis relacionales suelen manifestarse cuando los patrones de comunicación se desgastan y el silencio o los reclamos reemplazan a la complicidad. Reconocer que se necesita una mirada neutral y profesional es el paso más maduro y valiente para sanar el vínculo o encontrar claridad mutua.`,
        puntosClave: [
          'Identificación del ciclo reactivo de reclamos para frenar la escalada del conflicto.',
          'Entrenamiento en escucha empática y expresión de necesidades sin ataques ni juicios.',
          'Pautas concretas para reconstruir la confianza, la cercanía afectiva y los acuerdos mutuos.'
        ],
        mensajeEspecialista: 'La Lic. Sofía Reynaga facilitará un espacio seguro, equilibrado e imparcial donde ambas partes puedan escucharse con respeto y reconstruir la armonía.'
      },
      en: {
        tituloPerfil: 'Profile: Couples Therapy & Relational Rebuilding',
        enfoqueRecomendado: 'Systemic Family Therapy & Assertive Communication',
        resumenEmpatico: `Hello ${nombre}, relationship distress typically arises when communication patterns wear down and reactive arguments or emotional distance replace mutual warmth. Acknowledging the need for professional guidance is the most mature step toward healing or finding clarity.`,
        puntosClave: [
          'Deconstructing reactive conflict cycles to prevent escalation.',
          'Training in empathetic active listening and expressing unmet emotional needs without blame.',
          'Clear guidelines to rebuild mutual trust, intimacy, and shared commitments.'
        ],
        mensajeEspecialista: 'Lic. Sofía Reynaga provides a neutral, safe and balanced therapeutic space where both perspectives are respected and supported.'
      }
    },

    apoyo: {
      es: {
        tituloPerfil: 'Perfil: Apoyo Emocional, Duelo y Desahogo',
        enfoqueRecomendado: 'Psicoterapia Humanista y Acompañamiento en Procesos de Duelo',
        resumenEmpatico: `Hola ${nombre}, transitar momentos de tristeza, desánimo o una pérdida significativa requiere de mucha gentileza contigo mismo/a. A veces intentamos mantenernos firmes ante los demás y acumulamos un peso silencioso. Tu dolor merece ser validado sin apuro y con el más profundo respeto.`,
        puntosClave: [
          'Espacio terapéutico de escucha activa, libre de juicios y con contención profesional.',
          'Herramientas respetuosas para procesar la tristeza, el duelo o la sensación de vacío.',
          'Reconexión progresiva con tus fuentes de motivación, autocuidado y bienestar personal.'
        ],
        mensajeEspecialista: 'La Lic. Sofía Reynaga te brindará una presencia cálida y profesional para transitar esta etapa con la compasión y el cuidado que mereces.'
      },
      en: {
        tituloPerfil: 'Profile: Emotional Support, Grief & Relief',
        enfoqueRecomendado: 'Humanistic Psychotherapy & Grief Accompaniment',
        resumenEmpatico: `Hello ${nombre}, going through times of sadness, discouragement or significant loss requires immense tenderness with yourself. Often we try to stay strong for others while carrying a silent weight. Your pain deserves validation in a safe, unhurried space.`,
        puntosClave: [
          'Active, non-judgmental listening space with compassionate clinical containment.',
          'Gentle, structured tools to navigate grief, sadness and emotional fatigue.',
          'Step-by-step reconnection with your personal vitality, self-worth and motivation.'
        ],
        mensajeEspecialista: 'Lic. Sofía Reynaga offers a warm, professional presence to help you navigate this season with the dignity and care you deserve.'
      }
    },

    general: {
      es: {
        tituloPerfil: 'Perfil: Orientación Psicológica y Crecimiento Personal',
        enfoqueRecomendado: 'Terapia Breve Enfocada en Soluciones y Fortalecimiento de Autoestima',
        resumenEmpatico: `Hola ${nombre}, buscar orientación psicológica para clarificar metas, establecer límites o fortalecer tu autoestima es una de las decisiones más inteligentes y preventivas para tu vida. Tener una brújula clínica te permitirá tomar decisiones alineadas con lo que de verdad valoras.`,
        puntosClave: [
          'Clarificación de prioridades, toma de decisiones y desarticulación de dudas paralizantes.',
          'Desarrollo de asertividad para aprender a poner límites saludables sin culpa.',
          'Plan de acción terapéutico enfocado en tu tranquilidad mental y desarrollo integral.'
        ],
        mensajeEspecialista: 'La Lic. Sofía Reynaga te acompañará a estructurar tus objetivos con técnicas clínicas probadas y un enfoque centrado en tus fortalezas.'
      },
      en: {
        tituloPerfil: 'Profile: Psychological Guidance & Personal Growth',
        enfoqueRecomendado: 'Solution-Focused Brief Therapy & Self-Esteem Strengthening',
        resumenEmpatico: `Hello ${nombre}, seeking psychological guidance to clarify goals, establish healthy boundaries, or reinforce your self-esteem is one of the wisest, most preventive investments in your life. Having clinical clarity enables you to make decisions aligned with your core values.`,
        puntosClave: [
          'Clarifying life choices, decision making and resolving paralyzing uncertainty.',
          'Developing assertiveness to establish healthy boundaries without guilt.',
          'An actionable therapeutic plan centered on your inner peace and strengths.'
        ],
        mensajeEspecialista: 'Lic. Sofía Reynaga will help you structure your goals with proven clinical methods tailored to your personal aspirations.'
      }
    }
  };

  const plantillaMotivo = PLANTILLAS[motivo] || PLANTILLAS.ansiedad;
  return esEn ? plantillaMotivo.en : plantillaMotivo.es;
}

export default {
  obtenerPlantillaClinica
};
