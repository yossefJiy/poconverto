import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LeadForm } from "@/components/home/LeadForm";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Sparkles, Users, X } from "lucide-react";
import welcomeGate from "@/assets/welcome-gate.png";

export function WelcomeGateCTA() {
  const { user } = useAuth();
  const [showLeadForm, setShowLeadForm] = useState(false);

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <Card className="overflow-hidden bg-card/80 backdrop-blur border-border/50 shadow-2xl">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Image Side */}
              <div className="relative h-64 md:h-auto overflow-hidden">
                <img 
                  src={welcomeGate} 
                  alt="Welcome Gate" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent md:bg-gradient-to-l" />
              </div>

              {/* Content Side */}
              <div className="p-8 md:p-10 flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  {!showLeadForm ? (
                    <motion.div
                      key="options"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-6"
                    >
                      <div>
                        <h2 className="text-2xl md:text-3xl font-bold mb-3">
                          ברוכים הבאים ל-
                          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            Converto
                          </span>
                        </h2>
                        <p className="text-muted-foreground">
                          הדשבורד החכם שמחבר את כל הנתונים שלכם
                        </p>
                      </div>

                      {/* Option 1: Registered Users */}
                      {user ? (
                        <div className="space-y-4">
                          <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                            <Users className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                            <div>
                              <h3 className="font-semibold text-foreground">לקוחות רשומים</h3>
                              <p className="text-sm text-muted-foreground">
                                הדשבורד שלכם מחכה עם כל הנתונים
                              </p>
                            </div>
                          </div>
                          <Button asChild size="lg" className="w-full text-lg py-6 bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/20">
                            <Link to="/dashboard">
                              לדשבורד שלכם
                              <ArrowLeft className="mr-2 h-5 w-5" />
                            </Link>
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Option: Registered Users Login */}
                          <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                            <Users className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                            <div className="flex-1">
                              <h3 className="font-semibold text-foreground">לקוחות רשומים</h3>
                              <p className="text-sm text-muted-foreground mb-3">
                                לדשבורד שלכם מכאן
                              </p>
                              <Button asChild variant="outline" className="w-full border-primary/30 hover:bg-primary/10">
                                <Link to="/auth">
                                  כניסה למערכת
                                  <ArrowLeft className="mr-2 h-4 w-4" />
                                </Link>
                              </Button>
                            </div>
                          </div>

                          {/* Option: New Users */}
                          <div className="flex items-start gap-3 p-4 rounded-lg bg-accent/5 border border-accent/20">
                            <Sparkles className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                            <div className="flex-1">
                              <h3 className="font-semibold text-foreground">רוצים להיות חלק מקונברטו?</h3>
                              <p className="text-sm text-muted-foreground mb-3">
                                השאירו לנו פרטים ונחזור אליכם
                              </p>
                              <Button 
                                onClick={() => setShowLeadForm(true)}
                                className="w-full bg-gradient-to-r from-accent to-primary hover:opacity-90"
                              >
                                השאירו פרטים
                                <ArrowLeft className="mr-2 h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold">השאירו פרטים</h3>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setShowLeadForm(false)}
                          className="h-8 w-8"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <LeadForm source="welcome_gate" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
