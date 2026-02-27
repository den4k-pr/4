export function idealWeights(heightCm, sex, age) {
  const h = heightCm;
  const hIn = h / 2.54;
  const isMale = sex === 'male';
  const devine = isMale ? 50 + 2.3 * (hIn - 60) : 45.5 + 2.3 * (hIn - 60);
  const robinson = isMale ? 52 + 1.9 * (hIn - 60) : 49 + 1.7 * (hIn - 60);
  const miller = isMale ? 56.2 + 1.41 * (hIn - 60) : 53.1 + 1.36 * (hIn - 60);
  const hamwi = isMale ? 48 + 2.7 * (hIn - 60) : 45.5 + 2.2 * (hIn - 60);

  const hm = h / 100;
  const bmiLow = Math.round(18.5 * hm * hm * 10) / 10;
  const bmiHigh = Math.round(24.9 * hm * hm * 10) / 10;
  const ageAdj = age > 40 ? Math.round((age - 40) * 0.05 * 10) / 10 : 0;

  return {
    devine: Math.round(devine),
    robinson: Math.round(robinson),
    miller: Math.round(miller),
    hamwi: Math.round(hamwi),
    bmiRange: [bmiLow, bmiHigh],
    recommended: Math.round((devine + robinson + miller + hamwi) / 4 + ageAdj),
    ageAdj,
  };
}

export function bmi(weight, heightCm) {
  const h = heightCm / 100;
  return weight / (h * h);
}

export function bmiCategory(bmiVal) {
  if (bmiVal < 18.5) return { label: 'Underweight', color: '#4ea8ff' };
  if (bmiVal < 25)   return { label: 'Healthy Weight', color: '#ff2442' };
  if (bmiVal < 30)   return { label: 'Overweight', color: '#ffc107' };
  if (bmiVal < 35)   return { label: 'Obese Class I', color: '#ff6b35' };
  return               { label: 'Obese Class II', color: '#ff4455' };
}