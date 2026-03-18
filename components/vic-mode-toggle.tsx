"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Mic, UserCircle, GraduationCap } from "lucide-react"

interface VICModeToggleProps {
    onModeSelect: (mode: "teacher" | "student") => void
}

export function VICModeToggle({ onModeSelect }: VICModeToggleProps) {
    const [open, setOpen] = useState(false)

    const handleModeSelect = (mode: "teacher" | "student") => {
        onModeSelect(mode)
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    size="lg"
                    className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
                >
                    <Mic className="w-5 h-5 animate-pulse" />
                    Live Voice-to-Content (VIC)
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-2xl text-center">Select Your Profile</DialogTitle>
                    <DialogDescription className="text-center">
                        Choose your role to start the Live Voice-to-Content experience
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6">
                    {/* Teacher Profile */}
                    <Card
                        className="cursor-pointer hover:border-purple-500 hover:shadow-lg transition-all group"
                        onClick={() => handleModeSelect("teacher")}
                    >
                        <CardContent className="pt-6 pb-6 text-center">
                            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <GraduationCap className="w-10 h-10 text-white" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Teacher</h3>
                            <p className="text-sm text-muted-foreground">
                                Create live educational content with voice
                            </p>
                        </CardContent>
                    </Card>

                    {/* Student Profile */}
                    <Card
                        className="cursor-pointer hover:border-blue-500 hover:shadow-lg transition-all group"
                        onClick={() => handleModeSelect("student")}
                    >
                        <CardContent className="pt-6 pb-6 text-center">
                            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <UserCircle className="w-10 h-10 text-white" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Student</h3>
                            <p className="text-sm text-muted-foreground">
                                Access saved lessons and recordings
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
    )
}
