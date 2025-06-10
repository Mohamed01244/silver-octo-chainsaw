import React, { useState, useEffect, useRef } from 'react';

// Helper component for rendering markdown-like text
const MarkdownRenderer = ({ text }) => {
    const renderText = (txt) => {
        // Replace ## titles
        txt = txt.replace(/^##\s*(.*)/gm, '<h2 class="text-2xl font-bold mb-3 text-gray-800">$1</h2>');
        // Replace • bullet points
        txt = txt.replace(/•\s*(.*)/gm, '<li class="mb-2 ml-4">$1</li>');
        // Replace **bold** text
        txt = txt.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>');
        return txt;
    };

    const sections = text.split(/(<h2.*<\/h2>)/).filter(Boolean);
    
    return (
        <div>
            {sections.map((section, index) => {
                if (section.startsWith('<h2')) {
                    const listItems = sections[index + 1] ? sections[index + 1].split('<li').filter(li => li.trim() !== '') : [];
                    return (
                        <div key={index}>
                            <div dangerouslySetInnerHTML={{ __html: section }} />
                            {listItems.length > 0 && (
                                <ul className="list-disc list-inside">
                                    {listItems.map((item, i) => (
                                         <li key={i} className="mb-2 ml-4" dangerouslySetInnerHTML={{ __html: renderText(item.replace(/.*?>/,'')) }} />
                                    ))}
                                </ul>
                            )}
                        </div>
                    )
                }
                // Only render text that doesn't follow a title (to avoid duplication)
                if (index === 0 && !sections[0].startsWith('<h2')) {
                     return <div key={index} dangerouslySetInnerHTML={{ __html: renderText(section) }} />;
                }
                return null;
            })}
        </div>
    );
};


// Main App Component
export default function App() {
    // State Management
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const chatEndRef = useRef(null);

    // Nour's constitution - System Prompt
    const systemPrompt = `
[System Role: الهوية الأساسية]
أنت "نور"، مرشد دراسي يعمل بالذكاء الاصطناعي، تم تطويرك خصيصًا لطلاب الثانوية العامة في مصر. أنت لست مجرد قاعدة بيانات للمعلومات، بل أنت مرشد أكاديمي ونفسي متكامل. مهمتك الأساسية هي ضمان الفهم العميق للمواد الدراسية، وبناء ثقة الطالب بنفسه، وتقديم الدعم اللازم لاجتياز هذه المرحلة بنجاح.
[Persona: شخصية المدرس المصري]
 * محترف وخبير: لديك فهم عميق لمناهج الثانوية العامة المصرية بجميع تفاصيلها وتحديثاتها (علمي وأدبي).
 * صبور ومتفهم: هدفك ليس إنهاء الدرس، بل وصول المعلومة للطالب. لا تظهر أي علامات ملل أو استعجال.
 * ذكي عاطفيًا: يمكنك استشعار حيرة الطالب أو قلقه من خلال طريقة صياغته للأسئلة.
 * منطقي وواقعي: تفكر كإنسان خبير وليس كآلة. تستخدم أمثلة من الحياة اليومية المصرية لتقريب المفاهيم المجردة.
 * مُحفِّز: تبث الأمل والطاقة الإيجابية في الطالب وتشعره دائمًا بالقدرة على النجاح.
 * اللهجة: تتحدث باللهجة المصرية المتعلمة والراقية، وتستخدم لغة بسيطة وواضحة ومباشرة.
[Core Pedagogy: منهجية التدريس]
 * الفهم أولًا: هدفك الرئيسي هو تحقيق الفهم الكامل. ابدأ دائمًا بشرح مبسط ومختصر ومباشر للمفهوم.
 * التنظيم: هيكل إجاباتك دائمًا باستخدام:
   * عناوين رئيسية واضحة (باستخدام ##).
   * نقاط منظمة (باستخدام •).
   * تظليل المصطلحات الهامة (باستخدام **bold**).
 * الاستجابة التكيفية: إذا أظهر الطالب حيرة، أو طلب المزيد من التفاصيل، قم بالتوسع في الشرح تلقائيًا. استخدم طرقًا مختلفة: اشرح المفهوم مرة أخرى بكلمات مختلفة، استخدم تشبيهًا (analogy)، أو قم بتقسيم المعلومة إلى خطوات أصغر وأبسط.
 * تحليل الصور: عند إعطائك صورة (سؤال من كتاب، رسم بياني، خريطة)، قم بتحليلها بدقة في سياق السؤال والمنهج المصري. اشرح مكوناتها، دلالاتها، والقوانين المتعلقة بها.
[Technical Directive: صيغة الرد الإلزامية]
قاعدة إلزامية مطلقة: يجب أن ترد دائمًا بصيغة JSON صالحة 100%. لا تضع أي نص، أو تعليقات، أو مسافات، أو علامات markdown قبل أو بعد كائن الـ JSON. يجب أن يكون ردك هو الـ JSON نفسه فقط.
الـ JSON يجب أن يحتوي على مفتاحين فقط:
 * "response": وقيمته هي نص إجابتك الكاملة والمنظمة.
 * "suggestions": وهي قائمة (array) تحتوي على 4 أسئلة مقترحة كنصوص (strings). هذه الاقتراحات يجب أن تكون ذكية وتدفع الطالب للتفكير أو استكشاف جوانب جديدة من الموضوع.
[Supplemental Role: الدعم النفسي]
إذا عبر الطالب عن مشاعر سلبية مثل القلق، الخوف من الامتحانات، الإرهاق، أو فقدان الشغف، قم بالتبديل إلى وضع "المرشد النفسي".
 * استخدم عبارات مطمئنة وداعمة.
 * اعترف بصحة مشاعره وأنها طبيعية تمامًا.
 * قدم له نصائح عملية ومختصرة حول تنظيم الوقت، تقنيات المذاكرة الفعالة، وأهمية أخذ فترات راحة.
 * تنبيه: لا تقدم نفسك كطبيب نفسي متخصص. إذا شعرت أن المشكلة كبيرة، انصحه بلطف بالتحدث مع شخص بالغ يثق به (الأهل، المرشد الطلابي).
[Constraints: المحظورات]
 * لا تخترع معلومات: إذا لم تكن متأكدًا، قل "سأبحث عن إجابة دقيقة لهذا السؤال وأعود إليك".
 * لا تخرج عن النطاق: التزم فقط بمناهج الثانوية العامة المصرية.
 * لا تقدم حلولًا نهائية: عند حل المسائل، قم بتوجيه الطالب خطوة بخطوة ليصل إلى الحل بنفسه، لا تعطه الإجابة النهائية مباشرة.
 
Based on the user's question, respond ONLY with a valid JSON object following the specified format.
`;

    // API Key
    const apiKey = "AIzaSyBsFexpbWLIbq007yklIYLMXwv5JoGf7Hg";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    // Auto-scroll to the latest message
    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    // Set initial welcome message from Nour
    useEffect(() => {
        const initialBotMessage = {
            response: "## أهلًا بيك أنا \"نور\"\nأنا هنا مخصوص علشان أكون معاك في رحلة الثانوية العامة. مهمتي مش بس إني أجاوبك على الأسئلة، لأ، مهمتي إني أساعدك تفهم كل معلومة بعمق، تزيد ثقتك في نفسك، وندخل الامتحانات واحنا مستعدين تمامًا.\n\n• تقدر تسألني في أي مادة، **علمي أو أدبي**.\n• ممكن نحل مسائل مع بعض خطوة بخطوة.\n• لو حسيت بأي قلق أو توتر، أنا هنا عشان أسمعك وأدعمك.\n\n**يلا بينا نبدأ رحلتنا. اسألني أي سؤال في بالك.**",
            suggestions: [
                "اشرح لي مفهوم \"كمية التحرك\" في الفيزياء.",
                "ما هي أهم نواتج الحملة الفرنسية على مصر؟",
                "إيه أفضل طريقة لحل مسائل الكيمياء العضوية؟",
                "أنا حاسس بإرهاق ومش قادر أذاكر، تنصحني بإيه؟"
            ]
        };
        setMessages([{
            sender: 'bot',
            text: initialBotMessage.response
        }]);
        setSuggestions(initialBotMessage.suggestions);
        setIsLoading(false);
    }, []);

    // Function to handle sending a message
    const handleSendMessage = async (messageText) => {
        if (!messageText.trim()) return;

        const newUserMessage = {
            sender: 'user',
            text: messageText
        };
        setMessages(prev => [...prev, newUserMessage]);
        setInputValue('');
        setIsLoading(true);
        setSuggestions([]);

        const chatHistory = messages.map(msg => ({
            role: msg.sender === 'user' ? "user" : "model",
            parts: [{ text: msg.text }]
        }));
        
        chatHistory.unshift({ role: "user", parts: [{ text: systemPrompt }] });
        chatHistory.push({ role: "user", parts: [{ text: messageText }] });

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: chatHistory
                }),
            });

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const result = await response.json();
            
            if (result.candidates && result.candidates.length > 0) {
                const botResponseRaw = result.candidates[0].content.parts[0].text;
                // Clean the response to ensure it is valid JSON
                const cleanedResponse = botResponseRaw.replace(/```json/g, '').replace(/```/g, '').trim();
                const botResponseData = JSON.parse(cleanedResponse);

                const newBotMessage = {
                    sender: 'bot',
                    text: botResponseData.response
                };
                setMessages(prev => [...prev, newBotMessage]);
                setSuggestions(botResponseData.suggestions);
            } else {
                 throw new Error("Invalid response structure from API.");
            }

        } catch (error) {
            console.error("Error fetching from API:", error);
            const errorMessage = {
                sender: 'bot',
                text: "عفوًا، حدث خطأ أثناء محاولة الرد. من فضلك حاول مرة أخرى."
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        handleSendMessage(inputValue);
    };

    const handleSuggestionClick = (suggestion) => {
        handleSendMessage(suggestion);
    };

    return (
        <div dir="rtl" className="font-sans bg-gray-100 h-screen flex flex-col" style={{ fontFamily: "'Tajawal', sans-serif" }}>
            {/* Header */}
            <header className="bg-white shadow-md p-4 flex items-center sticky top-0 z-10">
                <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mr-4">
                    ن
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-800">نور - مرشد الثانوية العامة</h1>
                    <p className="text-sm text-gray-500">هنا لمساعدتك على فهم أعمق ونجاح أكبر</p>
                </div>
            </header>

            {/* Chat Area */}
            <main className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="max-w-3xl mx-auto">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex mb-6 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-lg lg:max-w-xl px-5 py-3 rounded-2xl shadow ${msg.sender === 'user' ? 'bg-teal-500 text-white rounded-br-none' : 'bg-white text-gray-700 rounded-bl-none'}`}>
                                {msg.sender === 'bot' ? <MarkdownRenderer text={msg.text} /> : msg.text}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start mb-6">
                            <div className="max-w-lg px-5 py-3 rounded-2xl shadow bg-white text-gray-700 rounded-bl-none">
                                <div className="flex items-center space-x-2 space-x-reverse">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>
            </main>

            {/* Input Area */}
            <footer className="bg-white p-4 sticky bottom-0 border-t">
                <div className="max-w-3xl mx-auto">
                    {/* Suggestions */}
                    {suggestions.length > 0 && !isLoading && (
                        <div className="flex flex-wrap gap-2 mb-3 justify-center">
                            {suggestions.map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSuggestionClick(s)}
                                    className="px-4 py-2 bg-teal-50 text-teal-700 rounded-full text-sm hover:bg-teal-100 transition-colors"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleFormSubmit} className="flex items-center bg-gray-100 rounded-full p-2">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="اكتب سؤالك هنا..."
                            className="w-full bg-transparent focus:outline-none px-4 text-gray-700 placeholder-gray-500"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            className="bg-teal-500 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-teal-600 transition-colors disabled:bg-teal-300 disabled:cursor-not-allowed"
                            disabled={isLoading || !inputValue.trim()}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    </form>
                </div>
            </footer>
             <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap');
                `}
            </style>
        </div>
    );
}

