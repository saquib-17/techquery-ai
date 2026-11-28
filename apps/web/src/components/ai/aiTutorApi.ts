import type {
  AiTutorChatInput,
  AiTutorChatResponseDto,
} from "@techquery/shared";
import { api } from "../../lib/api";

export const aiTutorApi = {
  async chat(payload: AiTutorChatInput): Promise<AiTutorChatResponseDto> {
    const res = await api.post<{
      success: boolean;
      data: AiTutorChatResponseDto;
    }>("/ai-tutor/chat", payload);
    return res.data.data;
  },
};
