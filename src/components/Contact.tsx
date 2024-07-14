"use client";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { toast } from "react-hot-toast";
import { ClipLoader } from "react-spinners";
import React from "react";
import axios from "axios";

type ContactForm = {
  name: string;
  email: string;
  message: string;
};

export const Contact = ({ id }: { id: string }) => {
  const [formData, setFormData] = React.useState<ContactForm>({
    name: "",
    email: "",
    message: "",
  });

  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const { name, email, message } = formData;

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const validateForm = () => {
    if (!name || !email || !message) {
      toast.error("All fields are required.");
      return false;
    }
    if (!isValidEmail(email)) {
      toast.error("Please enter a valid email address.");
      return false;
    }
    return true;
  };

  const isValidEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const handleButtonClick = async (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    if (!validateForm()) {
      return;
    }
    setIsSubmitted(true); // Start showing the loader
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BASE_URL}contact/contact-me`,
        {
          name,
          email,
          message,
        }
      );
      if (response.status === 201) {
        toast.success("Contact has been sent successfully", {
          style: {
            border: "1px solid #713200",
            padding: "16px",
            color: "#c7a26b",
          },
          iconTheme: {
            primary: "#c7a26b",
            secondary: "#ECE3D4",
          },
          duration: 5000,
        });
        setFormData({
          name: "",
          email: "",
          message: "",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to send contact. Please try again later.");
    } finally {
      setIsSubmitted(false);
    }
  };

  return (
    <section id={id} className="flex justify-center w-full py-12 md:py-24 lg:py-32 bg-muted">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
              Contact Me
            </h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              I&apos;d love to hear from you! Feel free to reach out with any
              questions or inquiries.
            </p>
          </div>
          <div className="mx-auto w-full max-w-sm space-y-2">
            <form className="flex flex-col gap-4">
              <Input
                type="text"
                name="name"
                placeholder="Name"
                className="max-w-lg flex-1"
                value={name}
                onChange={handleInputChange}
              />
              <Input
                type="email"
                name="email"
                placeholder="Email"
                className="max-w-lg flex-1"
                value={email}
                onChange={handleInputChange}
              />
              <Textarea
                name="message"
                placeholder="Message"
                className="max-w-lg flex-1"
                value={message}
                onChange={handleInputChange}
              />
              <Button onClick={handleButtonClick} className="w-full">
                {isSubmitted ? (
                  <div className="flex justify-center items-center">
                    <ClipLoader size={30} color="#713200" />
                  </div>
                ) : (
                  "Submit"
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};
