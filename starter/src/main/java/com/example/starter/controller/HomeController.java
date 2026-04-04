package com.example.starter.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
@RequiredArgsConstructor
public class HomeController {

    /** Forward root to the landing page static asset */
    @GetMapping("/")
    public String home() {
        return "forward:/index.html";
    }
}
