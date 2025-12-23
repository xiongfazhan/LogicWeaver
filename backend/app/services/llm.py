"""LLM Service for AI-powered analysis.

Supports OpenAI-compatible APIs including:
- ChatGLM (local deployment / cloud API)
- OpenAI official API
- Other compatible providers
"""

import logging
from typing import Optional

from openai import OpenAI

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class LLMServiceError(Exception):
    """Base exception for LLM service errors."""
    pass


class LLMConnectionError(LLMServiceError):
    """Raised when connection to LLM API fails."""
    pass


class LLMResponseError(LLMServiceError):
    """Raised when LLM response is invalid."""
    pass


class LLMService:
    """
    LLM client wrapper supporting OpenAI-compatible APIs.
    
    Supports:
    - ChatGLM local deployment (http://localhost:8080/v1)
    - ChatGLM cloud API (https://open.bigmodel.cn/api/paas/v4)
    - OpenAI official API (https://api.openai.com/v1)
    """

    def __init__(
        self,
        api_base: Optional[str] = None,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
    ):
        """
        Initialize LLM service.
        
        Args:
            api_base: API base URL (default from settings)
            api_key: API key (default from settings)
            model: Model name (default from settings)
        """
        settings = get_settings()
        
        self.api_base = api_base or settings.llm_api_base
        self.api_key = api_key or settings.llm_api_key
        self.model = model or settings.llm_model
        self.enabled = settings.llm_enabled
        
        # Initialize OpenAI client with custom base URL
        self.client = OpenAI(
            api_key=self.api_key or "dummy-key",  # Some local deployments don't need key
            base_url=self.api_base,
        )
        
        logger.info(
            f"LLM Service initialized: provider={settings.llm_provider}, "
            f"model={self.model}, base_url={self.api_base}"
        )

    def is_enabled(self) -> bool:
        """Check if LLM service is enabled."""
        return self.enabled

    def chat(
        self,
        messages: list[dict],
        temperature: float = 0.7,
        max_tokens: int = 20000,
    ) -> str:
        """
        Send chat messages to LLM and get response.
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            temperature: Sampling temperature (0-2)
            max_tokens: Maximum tokens in response
            
        Returns:
            LLM response text
            
        Raises:
            LLMConnectionError: If connection fails
            LLMResponseError: If response is invalid
        """
        if not self.enabled:
            raise LLMServiceError("LLM service is disabled")

        # 打印请求数据
        print("=" * 60)
        print("LLM REQUEST")
        print(f"Model: {self.model}")
        print(f"Temperature: {temperature}, Max Tokens: {max_tokens}")
        for i, msg in enumerate(messages):
            role = msg.get("role", "unknown")
            content = msg.get("content", "")
            # 截断过长内容避免日志过大
            if len(content) > 500:
                content = content[:500] + "... (truncated)"
            print(f"Message[{i}] ({role}): {content}")
        print("=" * 60)

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            
            if not response.choices:
                raise LLMResponseError("No choices in LLM response")
            
            content = response.choices[0].message.content
            if content is None:
                raise LLMResponseError("Empty content in LLM response")
            
            # 打印响应数据
            print("=" * 60)
            print("LLM RESPONSE")
            print(
                f"Tokens: {response.usage.total_tokens if response.usage else 'unknown'} "
                f"(prompt={response.usage.prompt_tokens if response.usage else '?'}, "
                f"completion={response.usage.completion_tokens if response.usage else '?'})"
            )
            # 打印完整响应内容
            print(f"Content:\n{content}")
            print("=" * 60)
            
            return content

        except Exception as e:
            if "Connection" in str(e) or "connect" in str(e).lower():
                raise LLMConnectionError(f"Failed to connect to LLM API: {e}")
            raise LLMResponseError(f"LLM request failed: {e}")

    def analyze_text(self, prompt: str, content: str) -> str:
        """
        Analyze text content with LLM.
        
        Args:
            prompt: Analysis instruction
            content: Text content to analyze
            
        Returns:
            Analysis result
        """
        messages = [
            {"role": "system", "content": prompt},
            {"role": "user", "content": content},
        ]
        return self.chat(messages)

    def analyze_with_examples(
        self,
        system_prompt: str,
        examples: list[dict],
        query: str,
    ) -> str:
        """
        Analyze with few-shot examples.
        
        Args:
            system_prompt: System instruction
            examples: List of example dicts with 'input' and 'output'
            query: Query to analyze
            
        Returns:
            Analysis result
        """
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add examples as assistant/user turns
        for example in examples:
            messages.append({"role": "user", "content": example["input"]})
            messages.append({"role": "assistant", "content": example["output"]})
        
        # Add the actual query
        messages.append({"role": "user", "content": query})
        
        return self.chat(messages)


# Singleton instance
_llm_service: Optional[LLMService] = None


def get_llm_service() -> LLMService:
    """Get or create LLM service singleton."""
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service
