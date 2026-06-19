import type { Dispatch, SetStateAction } from "react";
import { assessmentOptions } from "../data/assessmentOptions";
import type {
  AssessmentAnswer,
  AssessmentOption,
  AssessmentQuestion,
} from "../types";

interface Step3AssessmentProps {
  assessmentAnswers: Record<string, AssessmentAnswer>;
  setAssessmentAnswers: Dispatch<
    SetStateAction<Record<string, AssessmentAnswer>>
  >;
}

const sectionTitles = {
  C: "C. 個案溝通能力",
  D: "D. 短期記憶評估",
  E: "E. 日常活動功能量表 ADLs",
  F: "F. 工具性日常活動功能量表 IADLs",
  G: "G. 特殊複雜照護需要",
  H: "H. 居家環境與社會參與",
  I: "I. 情緒及行為型態",
} as const;

function QuestionBlock({
  question,
  answer,
  setAssessmentAnswers,
}: {
  question: AssessmentQuestion;
  answer?: AssessmentAnswer;
  setAssessmentAnswers: Step3AssessmentProps["setAssessmentAnswers"];
}) {
  const saveAnswer = (nextAnswer: AssessmentAnswer) => {
    setAssessmentAnswers((currentAnswers) => ({
      ...currentAnswers,
      [question.id]: nextAnswer,
    }));
  };

  const handleSingleChange = (code: string) => {
    const selectedOption = question.options?.find(
      (option) => option.code === code
    );

    saveAnswer({
      questionId: question.id,
      type: "single",
      value: code,
      selectedOptions: selectedOption ? [selectedOption] : [],
    });
  };

  const handleMultiChange = (
    option: AssessmentOption,
    checked: boolean
  ) => {
    const currentCodes =
      answer?.type === "multi" && Array.isArray(answer.value)
        ? answer.value
        : [];

    const nextCodes = checked
      ? [...new Set([...currentCodes, option.code])]
      : currentCodes.filter((code) => code !== option.code);

    const selectedOptions =
      question.options?.filter((item) =>
        nextCodes.includes(item.code)
      ) ?? [];

    saveAnswer({
      questionId: question.id,
      type: "multi",
      value: nextCodes,
      selectedOptions,
    });
  };

  const handleTextChange = (text: string) => {
    saveAnswer({
      questionId: question.id,
      type: "text",
      value: text,
      text,
    });
  };

  const handleNumberChange = (rawValue: string) => {
    saveAnswer({
      questionId: question.id,
      type: "number",
      value: rawValue === "" ? "" : Number(rawValue),
    });
  };

  const singleValue =
    answer?.type === "single" && typeof answer.value === "string"
      ? answer.value
      : "";

  const multiValue: string[] =
    answer?.type === "multi" && Array.isArray(answer.value)
      ? answer.value
      : [];

  const textValue =
    answer?.type === "text" && typeof answer.value === "string"
      ? answer.value
      : "";

  const numberValue =
    answer?.type === "number" && typeof answer.value === "number"
      ? answer.value
      : "";

  return (
    <div className="rounded-lg border p-4">
      <div className="block font-bold">
        {question.id}. {question.title}
      </div>

      {question.note && (
        <div className="mt-1 text-sm text-slate-600">
          {question.note}
        </div>
      )}

      {question.type === "single" && (
        <select
          aria-label={question.title}
          className="mt-2 w-full border p-2"
          value={singleValue}
          onChange={(event) =>
            handleSingleChange(event.target.value)
          }
        >
          <option value="">請選擇</option>

          {question.options?.map((option) => (
            <option key={option.code} value={option.code}>
              {option.code}. {option.label}
            </option>
          ))}
        </select>
      )}

      {question.type === "multi" && (
        <div className="mt-2 space-y-2">
          {question.options?.map((option) => (
            <label
              key={option.code}
              className="flex items-start gap-2"
            >
              <input
                type="checkbox"
                checked={multiValue.includes(option.code)}
                onChange={(event) =>
                  handleMultiChange(
                    option,
                    event.target.checked
                  )
                }
              />

              <span>
                {option.code}. {option.label}
              </span>
            </label>
          ))}
        </div>
      )}

      {question.type === "text" && (
        <textarea
          aria-label={question.title}
          className="mt-2 min-h-24 w-full border p-2"
          value={textValue}
          onChange={(event) =>
            handleTextChange(event.target.value)
          }
        />
      )}

      {question.type === "number" && (
        <input
          aria-label={question.title}
          className="mt-2 w-full border p-2"
          type="number"
          value={numberValue}
          onChange={(event) =>
            handleNumberChange(event.target.value)
          }
        />
      )}
    </div>
  );
}

function Section({
  title,
  questions,
  assessmentAnswers,
  setAssessmentAnswers,
}: {
  title: string;
  questions: AssessmentQuestion[];
  assessmentAnswers: Step3AssessmentProps["assessmentAnswers"];
  setAssessmentAnswers: Step3AssessmentProps["setAssessmentAnswers"];
}) {
  return (
    <section className="space-y-4 rounded-xl bg-white p-6 shadow">
      <h2 className="text-xl font-bold">{title}</h2>

      {questions.map((question) => (
        <QuestionBlock
          key={question.id}
          question={question}
          answer={assessmentAnswers[question.id]}
          setAssessmentAnswers={setAssessmentAnswers}
        />
      ))}
    </section>
  );
}

export function Step3Assessment({
  assessmentAnswers,
  setAssessmentAnswers,
}: Step3AssessmentProps) {
  return (
    <div className="space-y-6">
      {Object.entries(sectionTitles).map(
        ([section, title]) => {
          const questions = assessmentOptions.filter(
            (question) => question.section === section
          );

          return (
            <Section
              key={section}
              title={title}
              questions={questions}
              assessmentAnswers={assessmentAnswers}
              setAssessmentAnswers={setAssessmentAnswers}
            />
          );
        }
      )}
    </div>
  );
}
