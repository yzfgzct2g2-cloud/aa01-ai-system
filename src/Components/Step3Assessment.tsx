import type { AA01Form } from "../types";
import {
  C_ASSESSMENT,
  D_ASSESSMENT,
  E_ADL_ASSESSMENT,
  F_IADL_ASSESSMENT,
  type AssessmentQuestion,
} from "../data/assessmentOptions";

type AssessmentAnswers = Record<string, string>;

function QuestionBlock({
  question,
  answers,
  onChange,
}: {
  question: AssessmentQuestion;
  answers: AssessmentAnswers;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div className="rounded-lg border p-4">
      <label className="block font-bold">
        {question.key}. {question.title}
      </label>

      {question.note && (
        <div className="mt-1 text-sm text-slate-600">{question.note}</div>
      )}

      <select
        className="mt-2 w-full border p-2"
        value={answers[question.key] || ""}
        onChange={(e) => onChange(question.key, e.target.value)}
      >
        <option value="">請選擇</option>
        {question.options?.map((option) => (
          <option key={option.code} value={option.code}>
            {option.code}. {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Section({
  title,
  questions,
  answers,
  onChange,
}: {
  title: string;
  questions: AssessmentQuestion[];
  answers: AssessmentAnswers;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <section className="space-y-4 rounded-xl bg-white p-6 shadow">
      <h2 className="text-xl font-bold">{title}</h2>

      {questions.map((question) => (
        <QuestionBlock
          key={question.key}
          question={question}
          answers={answers}
          onChange={onChange}
        />
      ))}
    </section>
  );
}

export function Step3Assessment({
  form,
  setForm,
}: {
  form: AA01Form;
  setForm: (form: AA01Form) => void;
}) {
  const answers = form.assessmentAnswers || {};

  const updateAnswer = (key: string, value: string) => {
    setForm({
      ...form,
      assessmentAnswers: {
        ...answers,
        [key]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      <Section
        title="C. 個案溝通能力"
        questions={C_ASSESSMENT}
        answers={answers}
        onChange={updateAnswer}
      />

      <Section
        title="D. 短期記憶評估"
        questions={D_ASSESSMENT}
        answers={answers}
        onChange={updateAnswer}
      />

      <Section
        title="E. 日常活動功能量表 ADLs"
        questions={E_ADL_ASSESSMENT}
        answers={answers}
        onChange={updateAnswer}
      />

      <Section
        title="F. 工具性日常活動功能量表 IADLs"
        questions={F_IADL_ASSESSMENT}
        answers={answers}
        onChange={updateAnswer}
      />
    </div>
  );
}