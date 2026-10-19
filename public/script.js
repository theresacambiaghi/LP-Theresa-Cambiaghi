const form = document.querySelector('#survey-form');
const steps = [...document.querySelectorAll('.quiz-step')];
const nextButton = document.querySelector('#next-button');
const backButton = document.querySelector('#back-button');
const submitButton = document.querySelector('#submit-button');
const errorBox = document.querySelector('#form-error');
const progressBar = document.querySelector('#progress-bar');
const progressLabel = document.querySelector('#progress-label');
const progressCount = document.querySelector('#progress-count');
const successState = document.querySelector('#success-state');

let currentStep = 0;

const labels = ['Identificação', 'Horários dos membros', 'Sua rotina', 'Preferência', 'Experiência', 'Interesse', 'Observações', 'Horário do aulão'];

function showStep(index) {
  currentStep = Math.max(0, Math.min(index, steps.length - 1));
  steps.forEach((step, stepIndex) => step.classList.toggle('is-active', stepIndex === currentStep));

  const progress = ((currentStep + 1) / steps.length) * 100;
  progressBar.style.width = `${progress}%`;
  progressLabel.textContent = labels[currentStep];
  progressCount.textContent = `${currentStep + 1} / ${steps.length}`;

  backButton.hidden = currentStep === 0;
  nextButton.hidden = currentStep === steps.length - 1;
  submitButton.hidden = currentStep !== steps.length - 1;
  nextButton.firstChild.textContent = currentStep === 0 ? 'Começar ' : 'Continuar ';
  errorBox.textContent = '';

  const quizTop = document.querySelector('.quiz-card').getBoundingClientRect().top;
  if (quizTop < 12) document.querySelector('.quiz-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function validateCurrentStep() {
  const step = steps[currentStep];
  const required = [...step.querySelectorAll('[required]')];

  if (currentStep === 0) {
    const invalid = required.find((field) => !field.value.trim());
    if (invalid) {
      errorBox.textContent = 'Preencha seu nome e WhatsApp para continuar.';
      invalid.focus();
      return false;
    }
  }

  if (currentStep === 1 && !step.querySelector('input:checked')) {
    errorBox.textContent = 'Escolha pelo menos um horário para continuar.';
    step.querySelector('input').focus();
    return false;
  }

  if ((currentStep >= 2 && currentStep <= 5) || currentStep === 7) {
    const groupName = required[0]?.name;
    if (groupName && !step.querySelector(`input[name="${groupName}"]:checked`)) {
      errorBox.textContent = 'Selecione uma opção para continuar.';
      step.querySelector('input').focus();
      return false;
    }
  }

  return true;
}

function formatPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

form.elements.whatsapp.addEventListener('input', (event) => {
  event.target.value = formatPhone(event.target.value);
});

nextButton.addEventListener('click', () => {
  if (validateCurrentStep()) showStep(currentStep + 1);
});

backButton.addEventListener('click', () => showStep(currentStep - 1));

form.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && event.target.tagName !== 'TEXTAREA' && currentStep < steps.length - 1) {
    event.preventDefault();
    nextButton.click();
  }
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!validateCurrentStep()) return;

  submitButton.disabled = true;
  submitButton.firstChild.textContent = 'Enviando... ';
  errorBox.textContent = '';

  const formData = new FormData(form);
  const payload = {
    name: formData.get('name'),
    whatsapp: formData.get('whatsapp'),
    horarios: formData.getAll('horarios'),
    frequencia: formData.get('frequencia'),
    preferencia: formData.get('preferencia'),
    experiencias: formData.get('experiencias'),
    interesse: formData.get('interesse'),
    aulaoHorario: formData.get('aulaoHorario'),
    mensagem: formData.get('mensagem'),
    website: formData.get('website')
  };

  try {
    const response = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 409) loadAvailability();
      throw new Error(result.error || 'Não foi possível enviar agora.');
    }

    form.hidden = true;
    document.querySelector('.quiz-progress').hidden = true;
    successState.hidden = false;
    successState.focus();
  } catch (error) {
    errorBox.textContent = `${error.message} Tente novamente em alguns instantes.`;
  } finally {
    submitButton.disabled = false;
    submitButton.firstChild.textContent = 'Enviar inscrição ';
  }
});

showStep(0);

async function loadAvailability() {
  const status = document.querySelector('#availability-status');
  if (!status) return;

  try {
    const response = await fetch('/api/availability', { method: 'GET', cache: 'no-store' });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.slots) throw new Error('Disponibilidade indisponível');

    document.querySelectorAll('input[name="aulaoHorario"]').forEach((input) => {
      const slot = result.slots[input.value];
      const remaining = input.closest('.slot-option').querySelector('.slot-remaining');
      const available = !slot || slot.available !== false;
      input.disabled = !available;
      if (!available) input.checked = false;
      remaining.textContent = available ? `${slot?.remaining ?? result.capacity} ${slot?.remaining === 1 ? 'vaga' : 'vagas'}` : 'Esgotado';
    });

    status.textContent = 'As vagas são confirmadas no momento do envio.';
  } catch {
    status.textContent = 'A disponibilidade será confirmada no momento do envio.';
  }
}

loadAvailability();
