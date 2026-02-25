'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  GraduationCap, BookOpen, Clock, Trophy, ChevronDown, ChevronUp,
  Play, Lock, CheckCircle2, Target, Briefcase, PoundSterling,
  Loader2, Award, BarChart3, Sparkles, ArrowRight, FileText,
} from 'lucide-react';

interface BestAttempt {
  id: string;
  scorePercent: number;
  passed: boolean;
  mode: string;
  finishedAt: string;
}
interface ExamModule {
  id: string;
  title: string;
  code: string | null;
  description: string | null;
  learningOutcomes: string[];
  topicsCovered: string[];
  estimatedHours: number | null;
  passMarkPercent: number;
  timeLimitMinutes: number;
  totalQuestions: number;
  questionCount: number;
  bestAttempt: BestAttempt | null;
}
interface CourseLevel {
  id: string;
  level: number;
  name: string;
  shortName: string;
  description: string;
  hmrcPermissions: string[];
  chPermissions: string[];
  professionalBody: string | null;
  qualificationTitle: string | null;
  estimatedStudyHours: number | null;
  examCostGbp: number | null;
  prerequisites: string | null;
  careerPaths: string[];
  salaryRangeMin: number | null;
  salaryRangeMax: number | null;
  iconEmoji: string | null;
  color: string | null;
  modules: ExamModule[];
}

export function AcademyClient() {
  const router = useRouter();
  const { toast } = useToast();
  const [courses, setCourses] = useState<CourseLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLevel, setExpandedLevel] = useState<number | null>(null);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/academy/courses');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setCourses(data.courses || []);
    } catch {
      toast({ title: 'Failed to load courses', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <GraduationCap className="h-8 w-8 text-amber-500" />
          Accounting Academy
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Your path to UK accounting qualifications — AAT Level 2 to ACCA Chartered
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: BookOpen, color: 'blue', label: 'Levels', value: courses.length },
          { icon: FileText, color: 'purple', label: 'Modules', value: courses.reduce((s, c) => s + c.modules.length, 0) },
          { icon: CheckCircle2, color: 'green', label: 'Passed', value: courses.reduce((s, c) => s + c.modules.filter(m => m.bestAttempt?.passed).length, 0) },
          { icon: Target, color: 'amber', label: 'Exams Available', value: courses.reduce((s, c) => s + c.modules.filter(m => m.questionCount > 0).length, 0) },
        ].map(s => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg bg-${s.color}-500/10 flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 text-${s.color}-500`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Roadmap */}
      <div className="relative">
        <div className="absolute left-[27px] top-8 bottom-8 w-0.5 bg-gradient-to-b from-green-500 via-blue-500 via-amber-500 via-red-500 to-purple-500 hidden md:block" />
        <div className="space-y-6">
          {courses.map((course) => {
            const isExpanded = expandedLevel === course.level;
            const passedModules = course.modules.filter(m => m.bestAttempt?.passed).length;
            const totalModules = course.modules.length;
            const allPassed = passedModules === totalModules && totalModules > 0;

            return (
              <div key={course.id} className="relative">
                <div className="flex items-start gap-4">
                  {/* Circle node */}
                  <div
                    className="hidden md:flex h-14 w-14 rounded-full border-4 items-center justify-center text-2xl flex-shrink-0 z-10"
                    style={{
                      borderColor: course.color || '#6b7280',
                      backgroundColor: allPassed ? (course.color || '#6b7280') + '20' : 'var(--background)',
                    }}
                  >
                    {allPassed ? '✅' : (course.iconEmoji || '📖')}
                  </div>

                  {/* Level card */}
                  <Card
                    className="flex-1 cursor-pointer transition-all hover:shadow-lg border-l-4"
                    style={{ borderLeftColor: course.color || '#6b7280' }}
                    onClick={() => setExpandedLevel(isExpanded ? null : course.level)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className="text-white text-xs font-bold" style={{ backgroundColor: course.color || '#6b7280' }}>
                              Level {course.level}
                            </Badge>
                            {course.professionalBody && (
                              <Badge variant="outline" className="text-xs">{course.professionalBody}</Badge>
                            )}
                            {allPassed && (
                              <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 text-xs">
                                <Trophy className="h-3 w-3 mr-1" /> Completed
                              </Badge>
                            )}
                          </div>
                          <h2 className="text-lg font-bold mt-2">{course.shortName}</h2>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{course.name}</p>
                          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {totalModules} modules</span>
                            {course.estimatedStudyHours && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> ~{course.estimatedStudyHours}h study</span>}
                            {course.examCostGbp && <span className="flex items-center gap-1"><PoundSterling className="h-3.5 w-3.5" /> £{course.examCostGbp} real exam</span>}
                            {passedModules > 0 && (
                              <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                                <CheckCircle2 className="h-3.5 w-3.5" /> {passedModules}/{totalModules} passed
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {course.salaryRangeMin && course.salaryRangeMax && (
                            <div className="hidden lg:block text-right">
                              <p className="text-xs text-muted-foreground">Salary range</p>
                              <p className="text-sm font-semibold">£{(course.salaryRangeMin / 1000).toFixed(0)}k – £{(course.salaryRangeMax / 1000).toFixed(0)}k</p>
                            </div>
                          )}
                          {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                        </div>
                      </div>

                      {/* Expanded level content */}
                      {isExpanded && (
                        <div className="mt-5 space-y-5 border-t pt-5" onClick={e => e.stopPropagation()}>
                          <p className="text-sm leading-relaxed whitespace-pre-line">{course.description}</p>

                          {/* HMRC + CH permissions */}
                          <div className="grid md:grid-cols-2 gap-4">
                            {course.hmrcPermissions.length > 0 && (
                              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40">
                                <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                                  <BarChart3 className="h-4 w-4 text-red-600 dark:text-red-400" /> HMRC Permissions Unlocked
                                </h4>
                                <ul className="space-y-1">
                                  {course.hmrcPermissions.map((p, i) => (
                                    <li key={i} className="text-xs flex items-start gap-1.5">
                                      <CheckCircle2 className="h-3.5 w-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                                      <span>{p}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {course.chPermissions.length > 0 && (
                              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40">
                                <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                                  <Briefcase className="h-4 w-4 text-blue-600 dark:text-blue-400" /> Companies House Permissions
                                </h4>
                                <ul className="space-y-1">
                                  {course.chPermissions.map((p, i) => (
                                    <li key={i} className="text-xs flex items-start gap-1.5">
                                      <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                                      <span>{p}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>

                          {/* Career paths + qualification */}
                          {course.careerPaths.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                <Award className="h-4 w-4" /> Career Paths
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {course.careerPaths.map((cp, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">{cp}</Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {course.qualificationTitle && (
                            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40">
                              <p className="text-sm"><strong>Qualification:</strong> {course.qualificationTitle}</p>
                              {course.prerequisites && <p className="text-xs text-muted-foreground mt-1"><strong>Prerequisites:</strong> {course.prerequisites}</p>}
                            </div>
                          )}

                          {/* Modules list */}
                          <div>
                            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                              <BookOpen className="h-4 w-4" /> Exam Modules
                            </h4>
                            <div className="space-y-3">
                              {course.modules.map(mod => {
                                const isModExpanded = expandedModule === mod.id;
                                const hasQuestions = mod.questionCount > 0;
                                return (
                                  <div
                                    key={mod.id}
                                    className="p-4 rounded-xl border bg-slate-50/50 dark:bg-slate-800/30 transition-all"
                                  >
                                    <div
                                      className="flex items-center justify-between cursor-pointer"
                                      onClick={() => setExpandedModule(isModExpanded ? null : mod.id)}
                                    >
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                                          mod.bestAttempt?.passed
                                            ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                                            : hasQuestions
                                              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                                              : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                                        }`}>
                                          {mod.bestAttempt?.passed ? <CheckCircle2 className="h-4 w-4" /> : (mod.code || '?')}
                                        </div>
                                        <div>
                                          <p className="font-medium text-sm">{mod.title}</p>
                                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                            {mod.estimatedHours && <span>{mod.estimatedHours}h</span>}
                                            <span>{mod.passMarkPercent}% pass mark</span>
                                            {mod.timeLimitMinutes > 0 && <span>{mod.timeLimitMinutes} min exam</span>}
                                            {mod.questionCount > 0 && <span className="text-amber-600 dark:text-amber-400">{mod.questionCount} questions</span>}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {mod.bestAttempt && (
                                          <Badge className={mod.bestAttempt.passed
                                            ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                                            : 'bg-red-500/20 text-red-600 dark:text-red-400'
                                          }>
                                            {mod.bestAttempt.scorePercent}%
                                          </Badge>
                                        )}
                                        {isModExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                      </div>
                                    </div>

                                    {/* Expanded module */}
                                    {isModExpanded && (
                                      <div className="mt-4 space-y-4 border-t pt-4">
                                        {mod.description && <p className="text-sm leading-relaxed">{mod.description}</p>}

                                        {mod.learningOutcomes.length > 0 && (
                                          <div>
                                            <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Learning Outcomes</h5>
                                            <ul className="space-y-1">
                                              {mod.learningOutcomes.map((lo, i) => (
                                                <li key={i} className="text-xs flex items-start gap-1.5">
                                                  <Target className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                                                  <span>{lo}</span>
                                                </li>
                                              ))}
                                            </ul>
                                          </div>
                                        )}

                                        {mod.topicsCovered.length > 0 && (
                                          <div>
                                            <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Topics Covered</h5>
                                            <div className="flex flex-wrap gap-1.5">
                                              {mod.topicsCovered.map((t, i) => (
                                                <Badge key={i} variant="outline" className="text-[10px]">{t}</Badge>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        {/* Exam actions */}
                                        <div className="flex items-center gap-3 pt-2">
                                          {hasQuestions ? (
                                            <>
                                              <Button
                                                size="sm"
                                                onClick={() => router.push(`/academy/exam/${mod.id}?mode=study`)}
                                              >
                                                <BookOpen className="h-4 w-4 mr-1.5" /> Study Mode
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => router.push(`/academy/exam/${mod.id}?mode=timed`)}
                                              >
                                                <Play className="h-4 w-4 mr-1.5" /> Timed Exam
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => router.push(`/academy/exam/${mod.id}?mode=study&ai=1`)}
                                              >
                                                <Sparkles className="h-4 w-4 mr-1.5" /> Ask AI Tutor
                                              </Button>
                                            </>
                                          ) : (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                              <Lock className="h-4 w-4" />
                                              <span>Questions coming soon — study the material above</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA banner */}
      <Card className="bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-blue-500/10 border-amber-500/20">
        <CardContent className="p-6 flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1">
            <h3 className="font-bold text-lg">Need help with your studies?</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Our AI Tutor can explain any accounting concept, help with practice questions, and clarify exam topics.
            </p>
          </div>
          <Button onClick={() => router.push('/learn')} className="whitespace-nowrap">
            <Sparkles className="h-4 w-4 mr-2" /> Go to Learn Hub <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
