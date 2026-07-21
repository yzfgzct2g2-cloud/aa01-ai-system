import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { assessmentOptions } from "../data/assessmentOptions";
import type {
  AssessmentAnswer,
  AssessmentOption,
  AssessmentQuestion,
} from "../types";
import {
  conditionalCategories,
  getRestoredQuestionId,
  getSectionProgress,
  getVisibleQuestionIds,
  inferSelectedCategories,
} from "./Step3Assessment.logic";
import type { SectionKey } from "./Step3Assessment.logic";
import type { DraftProgress } from "../persistence/draftModel";
import "./Step3Assessment.css";
import "./common/common.css";

interface Step3AssessmentProps {
  assessmentAnswers: Record<string, AssessmentAnswer>;
  setAssessmentAnswers: Dispatch<SetStateAction<Record<string, AssessmentAnswer>>>;
  currentSection?: SectionKey | null;
  currentQuestion?: string | null;
  onSectionChange?: (section: SectionKey | null) => void;
  onQuestionChange?: (questionId: string) => void;
  onProgressChange?: (progress: DraftProgress) => void;
}

type ConditionalSectionKey = "G" | "H" | "I";

const sectionOrder: SectionKey[] = ["C", "D", "E", "F", "G", "H", "I"];

const sectionTitles: Record<SectionKey, string> = {
  C: "C. 個案溝通能力",
  D: "D. 短期記憶評估",
  E: "E. 日常活動功能量表 ADLs",
  F: "F. 工具性日常活動功能量表 IADLs",
  G: "G. 特殊複雜照護需要",
  H: "H. 居家環境與社會參與",
  I: "I. 情緒及行為型態",
};

const navigationTitles: Record<SectionKey, string> = {
  C: "C 溝通能力",
  D: "D 記憶能力",
  E: "E ADLs",
  F: "F IADLs",
  G: "G 特殊照護",
  H: "H 環境與社會參與",
  I: "I 情緒行為",
};

function isConditionalSection(section: SectionKey): section is ConditionalSectionKey {
  return section === "G" || section === "H" || section === "I";
}

function QuestionBlock({
  question,
  answer,
  setAssessmentAnswers,
  onQuestionChange,
}: {
  question: AssessmentQuestion;
  answer?: AssessmentAnswer;
  setAssessmentAnswers: Step3AssessmentProps["setAssessmentAnswers"];
  onQuestionChange?: Step3AssessmentProps["onQuestionChange"];
}) {
  const saveAnswer = (nextAnswer: AssessmentAnswer) => {
    onQuestionChange?.(question.id);
    setAssessmentAnswers((currentAnswers) => ({
      ...currentAnswers,
      [question.id]: nextAnswer,
    }));
  };

  const handleSingleChange = (code: string) => {
    const selectedOption = question.options?.find((option) => option.code === code);
    saveAnswer({
      questionId: question.id,
      type: "single",
      value: code,
      selectedOptions: selectedOption ? [selectedOption] : [],
    });
  };

  const handleMultiChange = (option: AssessmentOption, checked: boolean) => {
    const currentCodes = answer?.type === "multi" && Array.isArray(answer.value)
      ? answer.value
      : [];
    const nextCodes = checked
      ? [...new Set([...currentCodes, option.code])]
      : currentCodes.filter((code) => code !== option.code);
    const selectedOptions = question.options?.filter((item) => nextCodes.includes(item.code)) ?? [];

    saveAnswer({
      questionId: question.id,
      type: "multi",
      value: nextCodes,
      selectedOptions,
    });
  };

  const singleValue = answer?.type === "single" && typeof answer.value === "string"
    ? answer.value
    : "";
  const multiValue = answer?.type === "multi" && Array.isArray(answer.value)
    ? answer.value
    : [];
  const textValue = answer?.type === "text" && typeof answer.value === "string"
    ? answer.value
    : "";
  const numberValue = answer?.type === "number" && typeof answer.value === "number"
    ? answer.value
    : "";

  return (
    <div
      className="assessment-question"
      id={`assessment-question-${question.id}`}
      tabIndex={-1}
      onFocusCapture={() => onQuestionChange?.(question.id)}
    >
      <div className="assessment-question__title">
        {question.id}. {question.title}
      </div>

      {question.note && <div className="assessment-question__note">{question.note}</div>}

      {question.type === "single" && (
        <select
          aria-label={question.title}
          className="assessment-control"
          value={singleValue}
          onChange={(event) => handleSingleChange(event.target.value)}
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
        <div className="assessment-options">
          {question.options?.map((option) => (
            <label key={option.code} className="assessment-option">
              <input
                type="checkbox"
                checked={multiValue.includes(option.code)}
                onChange={(event) => handleMultiChange(option, event.target.checked)}
              />
              <span>{option.code}. {option.label}</span>
            </label>
          ))}
        </div>
      )}

      {question.type === "text" && (
        <textarea
          aria-label={question.title}
          className="assessment-control assessment-control--textarea"
          value={textValue}
          onChange={(event) => saveAnswer({
            questionId: question.id,
            type: "text",
            value: event.target.value,
            text: event.target.value,
          })}
        />
      )}

      {question.type === "number" && (
        <input
          aria-label={question.title}
          className="assessment-control"
          type="number"
          value={numberValue}
          onChange={(event) => saveAnswer({
            questionId: question.id,
            type: "number",
            value: event.target.value === "" ? "" : Number(event.target.value),
          })}
        />
      )}
    </div>
  );
}

export function Step3Assessment({
  assessmentAnswers,
  setAssessmentAnswers,
  currentSection = null,
  currentQuestion = null,
  onSectionChange,
  onQuestionChange,
  onProgressChange,
}: Step3AssessmentProps) {
  const [openSection, setOpenSection] = useState<SectionKey | null>(currentSection ?? "C");
  const [selectedCategories, setSelectedCategories] = useState<Record<ConditionalSectionKey, string[]>>(() => {
    const answeredIds = Object.keys(assessmentAnswers);
    return {
      G: inferSelectedCategories("G", answeredIds),
      H: inferSelectedCategories("H", answeredIds),
      I: inferSelectedCategories("I", answeredIds),
    };
  });
  const sectionRefs = useRef<Partial<Record<SectionKey, HTMLElement | null>>>({});
  const restoredQuestionRef = useRef<string | null>(null);

  const getQuestions = (section: SectionKey) =>
    assessmentOptions.filter((question) => question.section === section);

  const getSectionDetails = (section: SectionKey) => {
    const questions = getQuestions(section);
    if (!isConditionalSection(section)) {
      const progress = getSectionProgress(questions.map((question) => question.id), assessmentAnswers);
      return { questions, visibleQuestions: questions, progress };
    }

    const selected = selectedCategories[section];
    const visibleIds = getVisibleQuestionIds(
      section,
      selected,
      questions.map((question) => question.id)
    );
    const visibleIdSet = new Set(visibleIds);
    const progress = getSectionProgress(visibleIds, assessmentAnswers, selected.length > 0);
    return {
      questions,
      visibleQuestions: questions.filter((question) => visibleIdSet.has(question.id)),
      progress,
    };
  };

  const sectionDetails = Object.fromEntries(
    sectionOrder.map((section) => [section, getSectionDetails(section)])
  ) as Record<SectionKey, ReturnType<typeof getSectionDetails>>;
  const overallAnswered = sectionOrder.reduce(
    (sum, section) => sum + sectionDetails[section].progress.answered,
    0
  );
  const overallTotal = sectionOrder.reduce(
    (sum, section) => sum + sectionDetails[section].progress.total,
    0
  );
  const overallPercent = overallTotal === 0 ? 0 : Math.round((overallAnswered / overallTotal) * 100);

  useEffect(() => {
    onProgressChange?.({
      answered: overallAnswered,
      total: overallTotal,
      percent: overallPercent,
    });
  }, [onProgressChange, overallAnswered, overallPercent, overallTotal]);

  useEffect(() => {
    onSectionChange?.(openSection);
  }, [onSectionChange, openSection]);

  useEffect(() => {
    if (!currentSection || openSection !== currentSection) return;
    const visibleQuestionIds = sectionDetails[currentSection].visibleQuestions.map(
      (question) => question.id
    );
    const restoredQuestion = getRestoredQuestionId(currentQuestion, visibleQuestionIds);
    if (!restoredQuestion || restoredQuestionRef.current === restoredQuestion) return;

    restoredQuestionRef.current = restoredQuestion;
    requestAnimationFrame(() => {
      const target = document.getElementById(`assessment-question-${restoredQuestion}`);
      target?.scrollIntoView({ block: "center" });
      target?.focus({ preventScroll: true });
    });
  }, [currentQuestion, currentSection, openSection, sectionDetails]);

  const changeOpenSection = (section: SectionKey | null) => {
    setOpenSection(section);
    onSectionChange?.(section);
  };

  const goToSection = (section: SectionKey) => {
    changeOpenSection(section);
    requestAnimationFrame(() => {
      sectionRefs.current[section]?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const toggleCategory = (section: ConditionalSectionKey, key: string, checked: boolean) => {
    setSelectedCategories((current) => ({
      ...current,
      [section]: checked
        ? [...new Set([...current[section], key])]
        : current[section].filter((categoryKey) => categoryKey !== key),
    }));
  };

  return (
    <>
      <h2 className="page-title">三、評估確認</h2>
      <div className="assessment-layout">
      <aside className="assessment-sidebar" aria-label="評估分區導覽">
        <div className="assessment-progress-card">
          <div className="assessment-progress-card__row">
            <strong>整體評估</strong>
            <span>{overallPercent}%</span>
          </div>
          <div className="assessment-progress" aria-label={`整體評估完成率 ${overallPercent}%`}>
            <span style={{ width: `${overallPercent}%` }} />
          </div>
        </div>

        <nav className="assessment-nav">
          {sectionOrder.map((section) => {
            const status = sectionDetails[section].progress.status;
            return (
              <button
                key={section}
                type="button"
                className={`assessment-nav__item${openSection === section ? " is-active" : ""}`}
                onClick={() => goToSection(section)}
              >
                <span>{navigationTitles[section]}</span>
                <small>{status}</small>
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="assessment-sections">
        {sectionOrder.map((section) => {
          const details = sectionDetails[section];
          const isOpen = openSection === section;
          const selected = isConditionalSection(section) ? selectedCategories[section] : [];
          const noneSelected = isConditionalSection(section)
            && conditionalCategories[section].some((category) => category.isNone && selected.includes(category.key));

          return (
            <section
              key={section}
              ref={(element) => { sectionRefs.current[section] = element; }}
              className="assessment-section"
              id={`assessment-section-${section}`}
            >
              <button
                type="button"
                className="assessment-section__header"
                aria-expanded={isOpen}
                aria-controls={`assessment-panel-${section}`}
                onClick={() => changeOpenSection(isOpen ? null : section)}
              >
                <span className="assessment-section__heading">
                  <span className="assessment-section__chevron" aria-hidden="true">{isOpen ? "−" : "+"}</span>
                  <span>{sectionTitles[section]}</span>
                </span>
                <span className={`assessment-status assessment-status--${details.progress.status}`}>
                  {details.progress.status}
                </span>
              </button>

              {isOpen && (
                <div className="assessment-section__panel" id={`assessment-panel-${section}`}>
                  {isConditionalSection(section) && (
                    <div className="assessment-category-card">
                      <div className="assessment-category-card__intro">
                        <strong>先選擇需要記錄的問題類別</strong>
                        <span>只會展開勾選類別的量表題目；此處不會自動判定個案狀態。</span>
                      </div>
                      <div className="assessment-category-grid">
                        {conditionalCategories[section].map((category) => (
                          <label
                            key={category.key}
                            className={`assessment-category${category.isNone ? " assessment-category--none" : ""}`}
                          >
                            <input
                              type="checkbox"
                              checked={selected.includes(category.key)}
                              onChange={(event) => toggleCategory(section, category.key, event.target.checked)}
                            />
                            <span>{category.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {noneSelected && (
                    <div className="assessment-notice">
                      已選擇無相關問題；若需填寫細項，請取消此項。原有已填資料仍會保留。
                    </div>
                  )}

                  {isConditionalSection(section) && selected.length === 0 && (
                    <div className="assessment-empty">請先勾選上方問題類別，再填寫對應細項。</div>
                  )}

                  {!noneSelected && details.visibleQuestions.map((question) => (
                    <QuestionBlock
                      key={question.id}
                      question={question}
                      answer={assessmentAnswers[question.id]}
                      setAssessmentAnswers={setAssessmentAnswers}
                      onQuestionChange={onQuestionChange}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
      </div>
    </>
  );
}
