import React, { useState } from 'react';
import './help.css';
import {
    Search,
    ChevronDown,
    ChevronUp,
    Book,
    HelpCircle,
    FileText,
    Users,
    Settings,
    Phone,
    Mail
} from 'lucide-react';

const Help = () => {
    const [activeSection, setActiveSection] = useState('general');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedItems, setExpandedItems] = useState({});

    const toggleItem = (itemId) => {
        setExpandedItems(prev => ({
            ...prev,
            [itemId]: !prev[itemId]
        }));
    };

    const sections = {
        general: {
            title: 'General Questions',
            icon: <HelpCircle size={20} />,
            items: [
                {
                    id: 'reset-password',
                    question: 'How do I reset my password?',
                    answer: 'Click the "Forgot Password" link on the login page and follow the instructions sent to your email.'
                },
                {
                    id: 'mobile-access',
                    question: 'Can I access the system from mobile devices?',
                    answer: 'Yes, the system is responsive and works on all modern mobile devices.'
                },
                {
                    id: 'update-profile',
                    question: 'How do I update my profile information?',
                    answer: 'Go to the Profile section from the main menu and click "Edit Profile".'
                }
            ]
        },
        expense: {
            title: 'Expense Related',
            icon: <FileText size={20} />,
            items: [
                {
                    id: 'submit-expense',
                    question: 'How do I submit an expense claim?',
                    answer: 'Navigate to Expenses > New Expense, fill in the required details, attach receipts, and submit.'
                },
                {
                    id: 'expense-approval',
                    question: 'What is the expense approval process?',
                    answer: 'Expenses are reviewed by your immediate supervisor, then by the finance department if required.'
                },
                {
                    id: 'approval-time',
                    question: 'How long does expense approval take?',
                    answer: 'Typically 2-3 business days, depending on the amount and type of expense.'
                }
            ]
        },
        project: {
            title: 'Project Related',
            icon: <Book size={20} />,
            items: [
                {
                    id: 'create-project',
                    question: 'How do I create a new project?',
                    answer: 'Go to Projects > New Project, fill in project details, assign team members, and set deadlines.'
                },
                {
                    id: 'modify-project',
                    question: 'Can I modify project details after creation?',
                    answer: 'Yes, if you have the required permissions. Go to Projects > Select Project > Edit.'
                },
                {
                    id: 'track-progress',
                    question: 'How do I track project progress?',
                    answer: 'Use the project dashboard to view timelines, milestones, and team progress.'
                }
            ]
        },
        leave: {
            title: 'Leave Related',
            icon: <Users size={20} />,
            items: [
                {
                    id: 'apply-leave',
                    question: 'How do I apply for leave?',
                    answer: 'Go to Leaves > New Request, select dates, type of leave, and submit.'
                },
                {
                    id: 'leave-balance',
                    question: 'How can I check my leave balance?',
                    answer: 'Go to Leaves > My Leaves to view your current balance and history.'
                },
                {
                    id: 'leave-process',
                    question: 'What is the leave approval process?',
                    answer: 'Leave requests are reviewed by your immediate supervisor and HR department.'
                }
            ]
        },
        attendance: {
            title: 'Attendance Related',
            icon: <Settings size={20} />,
            items: [
                {
                    id: 'mark-attendance',
                    question: 'How do I mark my attendance?',
                    answer: 'Use the attendance section to mark your daily check-in and check-out times.'
                },
                {
                    id: 'forgot-attendance',
                    question: 'What if I forget to mark attendance?',
                    answer: 'Contact your supervisor to request attendance correction.'
                },
                {
                    id: 'view-attendance',
                    question: 'Can I view my attendance history?',
                    answer: 'Yes, go to Attendance > My Attendance to view your history.'
                }
            ]
        }
    };

    const filteredSections = Object.entries(sections).reduce((acc, [key, section]) => {
        const filteredItems = section.items.filter(item =>
            item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.answer.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (filteredItems.length > 0) {
            acc[key] = { ...section, items: filteredItems };
        }
        return acc;
    }, {});

    return (
        <div className="help-container">
            <div className="help-header">
                <h1>Help Center</h1>
                <p>Find answers to common questions and learn how to use the system effectively</p>
            </div>

            <div className="help-search">
                <Search size={20} />
                <input
                    type="text"
                    placeholder="Search for help topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="help-content">
                <div className="help-sidebar">
                    {Object.entries(sections).map(([key, section]) => (
                        <button
                            key={key}
                            className={`sidebar-item ${activeSection === key ? 'active' : ''}`}
                            onClick={() => setActiveSection(key)}
                        >
                            {section.icon}
                            <span>{section.title}</span>
                        </button>
                    ))}
                </div>

                <div className="help-main">
                    {Object.entries(filteredSections).map(([key, section]) => (
                        <div key={key} className={`help-section ${activeSection === key ? 'active' : ''}`}>
                            <h2>{section.title}</h2>
                            <div className="faq-list">
                                {section.items.map(item => (
                                    <div key={item.id} className="faq-item">
                                        <button
                                            className="faq-question"
                                            onClick={() => toggleItem(item.id)}
                                        >
                                            <span>{item.question}</span>
                                            {expandedItems[item.id] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        </button>
                                        {expandedItems[item.id] && (
                                            <div className="faq-answer">
                                                <p>{item.answer}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="help-footer">
                <div className="contact-section">
                    <h3>Need More Help?</h3>
                    <div className="contact-options">
                        <a href="mailto:support@expensetracking.com" className="contact-item">
                            <Mail size={20} />
                            <span>Email Support</span>
                        </a>
                        <a href="tel:+1-XXX-XXX-XXXX" className="contact-item">
                            <Phone size={20} />
                            <span>Call Support</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Help;
