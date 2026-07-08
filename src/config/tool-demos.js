import MarkdownToolDemo from '@/components/tools/SystemToolDemo/index.vue';
import GitHubImageToolDemo from '@/components/tools/GitHubImageToolDemo/index.vue';

export const TOOL_DEMO_COMPONENTS = {
  'markdown-editor': MarkdownToolDemo,
  'github-image': GitHubImageToolDemo,
  picgo: GitHubImageToolDemo,
};

export function resolveToolDemoComponent(demoKey) {
  return TOOL_DEMO_COMPONENTS[demoKey] || null;
}
