
'use client';

import { useState, useEffect } from 'react';
import SectionIntroAnimation from '@/components/section-intro-animation';
import StartQuestionnaireModal from '@/components/start-questionnaire-modal';
import { BookHeart } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function WelcomePage() {
    const [showModal, setShowModal] = useState(true);
    const router = useRouter();

    const handleModalConfirm = () => {
        setShowModal(false);
    };
    
    return (
        <div className="h-full flex flex-col">
            <StartQuestionnaireModal
                isOpen={showModal}
                onConfirm={handleModalConfirm}
                onClose={() => {}} // Non-dismissible
            />
        </div>
    );
}
