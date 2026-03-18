"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ArrowLeft, Plus, Users, ChevronRight, Loader2, UserPlus } from "lucide-react"
import type { Class, Profile } from "@/lib/types"

interface ClassesListContentProps {
  classes: (Class & { class_assignments?: { student: Profile }[] })[]
}

export function ClassesListContent({ classes }: ClassesListContentProps) {
  const router = useRouter()
  const [showNewClassDialog, setShowNewClassDialog] = useState(false)
  const [showAddStudentDialog, setShowAddStudentDialog] = useState(false)
  const [selectedClass, setSelectedClass] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  // New class form
  const [className, setClassName] = useState("")
  const [classGrade, setClassGrade] = useState("")
  const [classDescription, setClassDescription] = useState("")

  // New student form
  const [studentName, setStudentName] = useState("")
  const [studentRollNo, setStudentRollNo] = useState("")

  const handleCreateClass = async () => {
    if (!className || !classGrade) return

    setIsCreating(true)
    try {
      const response = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: className,
          grade: classGrade,
          description: classDescription,
        }),
      })

      if (!response.ok) throw new Error("Failed to create class")

      setShowNewClassDialog(false)
      setClassName("")
      setClassGrade("")
      setClassDescription("")
      router.refresh()
    } catch (error) {
      console.error("Create class error:", error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleAddStudent = async () => {
    if (!studentName || !studentRollNo || !selectedClass) return

    setIsCreating(true)
    try {
      const response = await fetch("/api/students/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: studentName,
          rollNo: studentRollNo,
          classId: selectedClass,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to register student")
      }

      setShowAddStudentDialog(false)
      setStudentName("")
      setStudentRollNo("")
      setSelectedClass(null)
      router.refresh()
    } catch (error) {
      console.error("Add student error:", error)
      alert(error instanceof Error ? error.message : "Failed to add student")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Classes</h1>
                <p className="text-sm text-muted-foreground">{classes.length} classes</p>
              </div>
            </div>
            <Button className="gap-2" onClick={() => setShowNewClassDialog(true)}>
              <Plus className="h-4 w-4" />
              New Class
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {classes.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No classes yet</h3>
              <p className="text-muted-foreground mb-6">Create your first class to start adding students</p>
              <Button onClick={() => setShowNewClassDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Class
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls) => {
              const studentCount = cls.class_assignments?.length || 0
              return (
                <Card key={cls.id} className="hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{cls.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{cls.grade}</p>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span className="text-sm">{studentCount}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {cls.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{cls.description}</p>
                    )}
                    <div className="flex gap-2">
                      <Link href={`/classes/${cls.id}`} className="flex-1">
                        <Button variant="outline" className="w-full gap-1 bg-transparent">
                          View
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedClass(cls.id)
                          setShowAddStudentDialog(true)
                        }}
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>

      {/* New Class Dialog */}
      <Dialog open={showNewClassDialog} onOpenChange={setShowNewClassDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Class</DialogTitle>
            <DialogDescription>Create a class to organize your students and assign lessons.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="className">Class Name</Label>
              <Input
                id="className"
                placeholder="e.g., Class 6A"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="classGrade">Grade</Label>
              <Select value={classGrade} onValueChange={setClassGrade}>
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Std 6">Standard 6</SelectItem>
                  <SelectItem value="Std 7">Standard 7</SelectItem>
                  <SelectItem value="Std 8">Standard 8</SelectItem>
                  <SelectItem value="Std 9">Standard 9</SelectItem>
                  <SelectItem value="Std 10">Standard 10</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="classDescription">Description (Optional)</Label>
              <Textarea
                id="classDescription"
                placeholder="Brief description..."
                value={classDescription}
                onChange={(e) => setClassDescription(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewClassDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateClass} disabled={!className || !classGrade || isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Class"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              <p className="text-sm text-muted-foreground">
                This will be the student&apos;s username and default password
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddStudentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddStudent} disabled={!studentName || !studentRollNo || isCreating}>
              {isCreating ? (
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
    </div>
  )
}
