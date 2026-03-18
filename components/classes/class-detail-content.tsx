"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ArrowLeft, UserPlus, Users, BookOpen, Loader2, Trash2, Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Class, Profile, Lesson, Subject } from "@/lib/types"

interface ClassDetailContentProps {
  classData: Class & {
    class_assignments?: { id: string; student: Profile }[]
  }
  lessons: (Pick<Lesson, "id" | "title"> & { subject?: Pick<Subject, "name"> | null })[]
  assignedLessons: Array<{
    id: string
    lesson: (Pick<Lesson, "id" | "title"> & { subject?: Pick<Subject, "name"> | null }) | null
    assigned_at: string
  }>
}

export function ClassDetailContent({ classData, lessons, assignedLessons }: ClassDetailContentProps) {
  const router = useRouter()
  const [showAddStudentDialog, setShowAddStudentDialog] = useState(false)
  const [showAssignLessonDialog, setShowAssignLessonDialog] = useState(false)
  const [studentToRemove, setStudentToRemove] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const [studentName, setStudentName] = useState("")
  const [studentRollNo, setStudentRollNo] = useState("")
  const [selectedLessonId, setSelectedLessonId] = useState("")

  const students = classData.class_assignments?.map((a) => ({ ...a.student, assignmentId: a.id })) || []
  const unassignedLessons = lessons.filter((l) => !assignedLessons.find((a) => a.lesson?.id === l.id))

  const handleAddStudent = async () => {
    if (!studentName || !studentRollNo) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/students/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: studentName,
          rollNo: studentRollNo,
          classId: classData.id,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to register student")
      }

      setShowAddStudentDialog(false)
      setStudentName("")
      setStudentRollNo("")
      router.refresh()
    } catch (error) {
      console.error("Add student error:", error)
      alert(error instanceof Error ? error.message : "Failed to add student")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveStudent = async () => {
    if (!studentToRemove) return

    setIsLoading(true)
    const supabase = createClient()

    try {
      const { error } = await supabase.from("class_assignments").delete().eq("id", studentToRemove)

      if (error) throw error

      setStudentToRemove(null)
      router.refresh()
    } catch (error) {
      console.error("Remove student error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAssignLesson = async () => {
    if (!selectedLessonId) return

    setIsLoading(true)
    const supabase = createClient()

    try {
      const { error } = await supabase.from("lesson_assignments").insert({
        lesson_id: selectedLessonId,
        class_id: classData.id,
      })

      if (error) throw error

      setShowAssignLessonDialog(false)
      setSelectedLessonId("")
      router.refresh()
    } catch (error) {
      console.error("Assign lesson error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/classes">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">{classData.name}</h1>
                <p className="text-sm text-muted-foreground">{classData.grade}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Students Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Students ({students.length})
                </CardTitle>
                <Button size="sm" onClick={() => setShowAddStudentDialog(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Student
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No students in this class yet</p>
              ) : (
                <div className="space-y-3">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                    >
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-muted-foreground font-mono">{student.roll_no}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setStudentToRemove(student.assignmentId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assigned Lessons Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Assigned Lessons ({assignedLessons.length})
                </CardTitle>
                <Button
                  size="sm"
                  onClick={() => setShowAssignLessonDialog(true)}
                  disabled={unassignedLessons.length === 0}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Assign Lesson
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {assignedLessons.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No lessons assigned to this class</p>
              ) : (
                <div className="space-y-3">
                  {assignedLessons.map(
                    (assignment) =>
                      assignment.lesson && (
                        <Link key={assignment.id} href={`/lessons/${assignment.lesson.id}`}>
                          <div className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/50 transition-colors">
                            <div>
                              <p className="font-medium">{assignment.lesson.title}</p>
                              <p className="text-sm text-muted-foreground">{assignment.lesson.subject?.name}</p>
                            </div>
                          </div>
                        </Link>
                      ),
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Add Student Dialog */}
      <Dialog open={showAddStudentDialog} onOpenChange={setShowAddStudentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register New Student</DialogTitle>
            <DialogDescription>
              Create a student account. The roll number will be used as the login username and default password.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="studentName">Student Name</Label>
              <Input
                id="studentName"
                placeholder="e.g., Rahul Sharma"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="studentRollNo">Roll Number</Label>
              <Input
                id="studentRollNo"
                placeholder="e.g., STD6-001"
                value={studentRollNo}
                onChange={(e) => setStudentRollNo(e.target.value.toUpperCase())}
                className="font-mono"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddStudentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddStudent} disabled={!studentName || !studentRollNo || isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Registering...
                </>
              ) : (
                "Register Student"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Lesson Dialog */}
      <Dialog open={showAssignLessonDialog} onOpenChange={setShowAssignLessonDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Lesson to Class</DialogTitle>
            <DialogDescription>Select a lesson to make it available to all students in this class.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Lesson</Label>
              <Select value={selectedLessonId} onValueChange={setSelectedLessonId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a lesson" />
                </SelectTrigger>
                <SelectContent>
                  {unassignedLessons.map((lesson) => (
                    <SelectItem key={lesson.id} value={lesson.id}>
                      {lesson.title} ({lesson.subject?.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignLessonDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignLesson} disabled={!selectedLessonId || isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                "Assign Lesson"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Student Confirmation */}
      <AlertDialog open={!!studentToRemove} onOpenChange={() => setStudentToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Student from Class</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the student from this class. The student account will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveStudent} className="bg-destructive text-destructive-foreground">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
