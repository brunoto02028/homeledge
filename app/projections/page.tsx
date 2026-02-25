import { Metadata } from 'next';
import { ProjectionsClient } from './projections-client';

export const metadata: Metadata = {
  title: 'Financial Projections | HomeLedger',
};

export default function ProjectionsPage() {
  return <ProjectionsClient />;
}
